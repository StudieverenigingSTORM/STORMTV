if (localStorage.getItem('standardmode') === null || (tizen.time.getCurrentDateTime().getHours()<12 && tizen.time.getCurrentDateTime().getHours() > 2)){
	localStorage.setItem('standardmode', true);
}

if (localStorage.getItem('currentSource') === null){
	localStorage.setItem('currentSource', 'http://storm.vu/~tvpromocie/');
}

tizen.systeminfo.getPropertyValue("DISPLAY", function(e){
    if(e.resolutionHeight == 1080 && e.resolutionWidth == 1920){
    	localStorage.setItem('resolution', 'FHD');
    } else {
    	localStorage.setItem('resolution', 'HD');
    	initRes();
    }
});

function initRes(){
	document.getElementById("OV").style.width = 1280;
	document.getElementById("OV").style.height = 720;
	document.getElementsByClassName("contents")[0].style.width = 1280;
	document.getElementsByClassName("contents")[0].style.height = 720;
}

var standardmode = localStorage.getItem('standardmode') == 'false' ? false : true;
console.log('standardmode='+standardmode);

var prefix = localStorage.getItem('currentSource');
var index = -1;
var playlist = [];
var borrel = [];
var standard = [];
var text = 'OverlayText';

function loadScript(url, callback) {
	function fBuilder(string)
	{
	    return function () {
	        console.log(string);
	        console.log(arguments);
	    };
	}
	function appendScript(code) {
	    var s = document.createElement('script');
	    try {
	        s.appendChild(document.createTextNode(code));
	        document.body.appendChild(s);
	        console.log('[LoadScript] Finished loading script: '+url);
	    } catch (e) {
	        s.text = code;
	        document.body.appendChild(s);
	        console.log('[LoadScript] Finished loading script: '+url);
	    }
	}
	
	var cb = {
        onprogress: fBuilder('[PROGRESS]'),
        onpaused: fBuilder('[PAUSED]'),
        oncanceled: fBuilder('[CANCELED]'),
        oncompleted: function (dlId, path) {
        	console.log('[FINISHED] Script update');
            tizen.filesystem.resolve(path, function (file) {
                file.openStream('r', function (fileStream) {
                    var code = fileStream.read(fileStream.bytesAvailable);
                    fileStream.close(); fileStream = null;
                    appendScript(code);
                    // eval('main();');
                    if (typeof(callback)=='function')
                    {
                        callback();
                    }
                });
            });
        },
        onfailed: fBuilder('[FAILED]')
    };
	try {
		tizen.download.start(new tizen.DownloadRequest(url), cb);
	} catch(e) {
		console.log('Script update failed'+e);
	}
}


function showOverlay(text, time) {
	var overlay = document.getElementById('overlay');
	overlay.innerHTML = text;
	function hideDiv(){
		overlay.style.visibility='hidden';
	}
	overlay.style.visibility='visible';
	window.setTimeout(hideDiv, time);
}

function nextVideo(){
	//refresh variables standard and borrel
	loadScript(prefix+'createlisting.php');
	playlist = standardmode ? standard : borrel;
  	webapis.appcommon.setScreenSaver(webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF);
  	try {
  		webapis.avplay.stop();
  	} catch (e) {
  		console.log(e);
  	}
	index++;
	try
	{
		webapis.avplay.open(playlist[index%playlist.length]);
		webapis.avplay.prepareAsync(
			    function () {
			    	hideOV();
			        webapis.avplay.play();
			    },
			    function (e) {
			        console.log('Prepare error:'+e);
					showOverlay('Error preparing video, try again in 10 seconds', 10000);
					window.setTimeout(function() {
						nextVideo();
					}, 10000);
			    }
		);
	}
	catch(err)
	{
		console.log('Error Loading nextVideo()');
		console.log(err);
//		showOverlay('Error loading video, try again in 10 seconds', 10000);
		window.setTimeout(function() {
			nextVideo();
		}, 10000);
	}
}

var OVtimer1, OVtimer2;
function loadNext(){
	if((index+1)%12 == 0 && index != -1) {
		document.getElementById('OV').style.visibility = 'visible';
		document.getElementById('OV').src = 'http://storm.vu/~tvpromocie/OV/index.php?res=' + localStorage.getItem('resolution');
		OVtimer1 = window.setTimeout(function() {
			document.getElementById('OV').src += '&page=2';
      	}, 20000);
		OVtimer2 = window.setTimeout(nextVideo,40000);
	} else {
		nextVideo();
	}
}

var listener = {
	onbufferingstart: function() {
	    console.log('Buffering start.');
	},
    onbufferingcomplete: function() {
        console.log('Buffering complete.');
    },
    oncurrentplaytime: function(currentTime) {
        //console.log("Current Playtime : " + webapis.avplay.getCurrentTime());
    },
	onstreamcompleted : function() {
		// this event will be fired when current stream reaches end of play.
		console.log('Stream Completed');
		//prevent memory leak Stop/close player after each end of playlist.
		webapis.avplay.stop();
		//webapis.avplay.close();
		loadNext();
	}
};

function reInit() {
	index = -1;
 	webapis.avplay.stop();
	nextVideo();
}

function autostart(){
	// Gets the current application ID.
	  var appId = tizen.application.getCurrentApplication().appInfo.id,
	  // Sets a date on January 1st 2016 08:40
	      date = new Date(2016, 0, 1, 8, 40),
	  // Sets an alarm occurring on every weekday at 08:40, starting from January 1st 2016
	      alarm3 = new tizen.AlarmAbsolute(date, ["MO", "TU", "WE", "TH", "FR"]);
	  tizen.alarm.add(alarm3, appId);
}

function switchMode(){
  	if(standardmode) {
  		console.log('Switching to borrel mode');
  		text = 'Switching to borrel mode';
  		localStorage.setItem('standardmode', false);
  	} else {
  		console.log('Switching to standard mode');
  		text = 'Switching to standard mode';
  		localStorage.setItem('standardmode', true);
  	}
  	standardmode = localStorage.getItem('standardmode') == 'false' ? false : true;
  	showOverlay(text,10000);
	loadScript(prefix+'createlisting.php');
	hideOV();
  	window.setTimeout(reInit,5000);
}

function switchSource(){
  	if(prefix == 'http://web.int.storm.vu/~tvpromocie/') {
  		console.log('Switching source to http://storm.vu/~tvpromocie/');
  		text = 'Switching source to <BR> http://storm.vu/';
  		localStorage.setItem('currentSource', 'http://storm.vu/~tvpromocie/');
  	} else {
  		console.log('Switching source to http://web.int.storm.vu/~tvpromocie/');
  		text = 'Switching source to <BR> http://web.int.storm.vu/';
  		localStorage.setItem('currentSource', 'http://web.int.storm.vu/~tvpromocie/');
  	}
  	prefix = localStorage.getItem('currentSource');
  	showOverlay(text,10000);
	loadScript(prefix+'createlisting.php');
	hideOV();
  	window.setTimeout(reInit,5000);
}

function hideOV(){
	window.clearTimeout(OVtimer1);
	window.clearTimeout(OVtimer2);
	document.getElementById('OV').style.visibility = 'hidden';
}

function beerMeter(){
 	webapis.avplay.stop();
 	hideOV();
	webapis.avplay.open(prefix+'beermeter/BeerMeter1.mp4');
	webapis.avplay.prepareAsync(
		    function () {
		        webapis.avplay.play();
		    },
		    function (e) {
		        console.log('Prepare error: '+ e);
		    }        
	);
	console.log('BeerMeter!');
}

function keys(){
	//unregister for standard exit key action
	tizen.tvinputdevice.unregisterKey("Exit");
	//register other keys
	tizen.tvinputdevice.registerKey("ChannelUp");
	tizen.tvinputdevice.registerKey("ChannelDown");
	tizen.tvinputdevice.registerKey("ColorF0Red");
	tizen.tvinputdevice.registerKey("ColorF1Green");
	tizen.tvinputdevice.registerKey("ColorF2Yellow");
	tizen.tvinputdevice.registerKey("ColorF3Blue");
	tizen.tvinputdevice.registerKey("Info");
	tizen.tvinputdevice.registerKey("Caption");
	tizen.tvinputdevice.registerKey("ChannelList");
	tizen.tvinputdevice.registerKey("E-Manual");
	tizen.tvinputdevice.registerKey("3D");
	tizen.tvinputdevice.registerKey("PictureSize");
	tizen.tvinputdevice.registerKey("Soccer");
	tizen.tvinputdevice.registerKey("Teletext");
	tizen.tvinputdevice.registerKey("MediaPlayPause");
	tizen.tvinputdevice.registerKey("MediaRewind");
	tizen.tvinputdevice.registerKey("MediaFastForward");
	tizen.tvinputdevice.registerKey("MediaPlay");
	tizen.tvinputdevice.registerKey("MediaPause");
	tizen.tvinputdevice.registerKey("MediaStop");
	tizen.tvinputdevice.registerKey("MediaRecord");
	tizen.tvinputdevice.registerKey("MediaTrackPrevious");
	tizen.tvinputdevice.registerKey("MediaTrackNext");
	tizen.tvinputdevice.registerKey("0");
	tizen.tvinputdevice.registerKey("1");
	tizen.tvinputdevice.registerKey("2");
	tizen.tvinputdevice.registerKey("3");
	tizen.tvinputdevice.registerKey("4");
	tizen.tvinputdevice.registerKey("5");
	tizen.tvinputdevice.registerKey("6");
	tizen.tvinputdevice.registerKey("7");
	tizen.tvinputdevice.registerKey("8");
	tizen.tvinputdevice.registerKey("9");
	tizen.tvinputdevice.registerKey("Minus");
	tizen.tvinputdevice.registerKey("PreviousChannel");
    document.addEventListener('keydown', function(e) {
        switch(e.keyCode) {
            // Left Arrow
            case 37:
    			console.log('LEFT');
            	switchMode();
                break;
            // Up Arrow
            case 38:
    			console.log('UP');
            	switchSource();
                break;
            // Right Arrow
            case 39:
    			console.log('RIGHT');
            	switchMode();
                break;
            // Down Arrow
            case 40:
    			console.log('DOWN');
            	switchSource();
                break;
            // Enter
            case 13:
    			console.log('ENTER');
            	beerMeter();
                break;
            // RETURN key of remote control
            case 10009:
    			console.log('RETURN');
            	text = 'Exiting application';
              	showOverlay(text,5000);
              	window.setTimeout(function() {/*
                    tizen.alarm.removeAll();
        			autostart();*/
                	tizen.application.getCurrentApplication().exit();
              	}, 5000);
                break;
                /*
            case tizen.tvinputdevice.getKey("Exit").code:
    			console.log('EXIT');
        		text = 'Exiting application';
	          	showOverlay(text,5000);
	          	window.setTimeout(function() {
	                tizen.alarm.removeAll();
        			autostart();
	            	tizen.application.getCurrentApplication().exit();
	          	}, 5000);
        	    break;*/
	            case tizen.tvinputdevice.getKey("ChannelUp").code:
	                break;
	            case tizen.tvinputdevice.getKey("ChannelDown").code:
	                break;
	            case tizen.tvinputdevice.getKey("ColorF0Red").code:
	                break;
	            case tizen.tvinputdevice.getKey("ColorF1Green").code:
	                break;
	            case tizen.tvinputdevice.getKey("ColorF2Yellow").code:
	                break;
	            case tizen.tvinputdevice.getKey("ColorF3Blue").code:
	                break;
	            case tizen.tvinputdevice.getKey("Info").code:
	    			console.log('INFO');
	        		text = 'Up/Down = Toggle source <BR> Left/Right = Toggle mode <BR> Enter = Beermeter';
		          	showOverlay(text,5000);
	                break;
	            case tizen.tvinputdevice.getKey("Caption").code:
	                break;
	            case tizen.tvinputdevice.getKey("ChannelList").code:
	                break;
	            case tizen.tvinputdevice.getKey("E-Manual").code:
	                break;
	            case tizen.tvinputdevice.getKey("3D").code:
	                break;
	            case tizen.tvinputdevice.getKey("PictureSize").code:
	                break;
	            case tizen.tvinputdevice.getKey("Soccer").code:
	                break;
	            case tizen.tvinputdevice.getKey("Teletext").code:
	                break;
	            case tizen.tvinputdevice.getKey("MediaPlayPause").code:
	            	if(webapis.avplay.getState() == "PLAYING") {
	            		webapis.avplay.pause();
	            	} else if(webapis.avplay.getState() == "PAUSED") {
	            		webapis.avplay.play();
	            	}
	                break;
	            case tizen.tvinputdevice.getKey("MediaRewind").code:
	             	webapis.avplay.stop();
	            	index -= 2;
	            	nextVideo();
	                break;
	            case tizen.tvinputdevice.getKey("MediaFastForward").code:
	             	webapis.avplay.stop();
            		nextVideo();
	                break;
	            case tizen.tvinputdevice.getKey("MediaPlay").code:
	            	if(webapis.avplay.getState() == "PLAYING") {
	            		webapis.avplay.pause();
	            	}
	                break;
	            case tizen.tvinputdevice.getKey("MediaPause").code:
	            	if(webapis.avplay.getState() == "PAUSED") {
	            		webapis.avplay.play();
	            	}
	                break;
	            case tizen.tvinputdevice.getKey("MediaStop").code:
	                break;
	            case tizen.tvinputdevice.getKey("MediaRecord").code:
	                break;
	            case tizen.tvinputdevice.getKey("MediaTrackPrevious").code:
	             	webapis.avplay.stop();
	            	index -= 2;
	            	nextVideo();
	                break;
	            case tizen.tvinputdevice.getKey("MediaTrackNext").code:
	             	webapis.avplay.stop();
	            	nextVideo();
	                break;
	            case tizen.tvinputdevice.getKey("0").code:
	                break;
	            case tizen.tvinputdevice.getKey("1").code:
	                break;
	            case tizen.tvinputdevice.getKey("2").code:
	                break;
	            case tizen.tvinputdevice.getKey("3").code:
	                break;
	            case tizen.tvinputdevice.getKey("4").code:
	                break;
	            case tizen.tvinputdevice.getKey("5").code:
	                break;
	            case tizen.tvinputdevice.getKey("6").code:
	                break;
	            case tizen.tvinputdevice.getKey("7").code:
	                break;
	            case tizen.tvinputdevice.getKey("8").code:
	                break;
	            case tizen.tvinputdevice.getKey("9").code:
	                break;
	            case tizen.tvinputdevice.getKey("Minus").code:
	                break;
	            case tizen.tvinputdevice.getKey("PreviousChannel").code:
	                break;
        }
    });
}

window.onload = function () {
	keys();
	// handle hiding of app
	document.addEventListener('visibilitychange', function() {
	    if(document.hidden){
	        webapis.avplay.suspend(); //Mandatory. You should call it, if you use avplay.
	        // Something you want to do when hide.
	    } else {
	        webapis.avplay.restore();
	// webapis.avplay.restore(optional DOMString URL, optional long resumeTime, optional boolean bPrepare) raises (WebAPIException);

	        // Something you want to do when resume.
	    }
	});

	//Check network connection 
	var networkerror = false;
	setInterval(function (text) {
		var network = document.getElementById('network');
		function hideDiv(){
			network.style.visibility='hidden';
		}
		if(webapis.network.getActiveConnectionType() == 0 || webapis.network.getGateway() == null || !webapis.network.isConnectedToGateway()){
			console.log('Network disconnected');
			text = 'Network disconnected';
			network.innerHTML = text;
			network.style.visibility='visible';
			networkerror = true;
		} else {
			if(networkerror){
				console.log('Network reconnected');
				text = 'Network reconnected';
				network.innerHTML = text;
				window.setTimeout(hideDiv, 5000);
				networkerror = false;
				nextVideo();
			}
		}
	},1000);
	
	webapis.network.addNetworkStateChangeListener(function (data) {
		var network = document.getElementById('network');
		function hideDiv(){
			network.style.visibility='hidden';
		}
	    if(data == 4){
			text = 'Network reconnected';
			network.innerHTML = text;
			window.setTimeout(hideDiv, 5000);
	        nextVideo();
	    } else if (data == 5){
			text = 'Network disconnected';
			network.innerHTML = text;
			network.style.visibility='visible';
	    }
	});
};

