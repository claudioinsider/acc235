var timerId;
// var timerElement = document.getElementById("exit-pop-timer");
var isPopupShowed = false;
var exitPopUpConfig = window.exitPopUp.video;
var bodyClassList = document.body.classList;
var config = bodyClassList.contains('button-shown') ? exitPopUpConfig.afterATC : exitPopUpConfig.beforeATC;
var timeParts = config.countdownTime.split(":");
var timerInterval = 0;
for (var i = 0; i < timeParts.length; i++) {
    timerInterval = 60 * timerInterval + parseInt(timeParts[i], 10);
}

function getQueryString() {
    return window.location.search;
}

function updateExitPopupLink() {
    var baseExitPopupUrl = "/long";
    var currentQueryString = getQueryString();
    var newUrl = baseExitPopupUrl + currentQueryString;

    var exitPopupLink = document.getElementById('exit-pop-link-to-text');
    if (exitPopupLink) {
        exitPopupLink.href = newUrl;
    }
}


function showPopup(closeable) {
    // Set popup text
    document.getElementById('exit-pop-title').innerHTML = config.title;
    document.getElementById('exit-pop-timer').innerHTML = config.timer;
    document.getElementById('exit-pop-subtitle').innerHTML = config.subtitle;
    document.getElementById('exit-pop-cta-text').innerHTML = config.CTAText;
    document.getElementById('exit-pop-text-letter').innerHTML = config.textLetterText;
    // Handle gifSection and additionalText
    var gifSection = document.getElementById('exit-pop-gif-section'); // Add this ID to your gif section in HTML
    var additionalTextSection = document.getElementById('exit-pop-additional-text'); // Add this ID to your additional text section in HTML

    if (config.gifSection.showByDefault) {
        gifSection.style.display = 'flex';
        // document.getElementById('exit-pop-gif').src = config.gifSection.imageSrc;
        var video = document.getElementById('exit-pop-gif');
        var videoSource = video.getElementsByTagName('source')[0]; // Get the first <source> element within the video tag
        videoSource.src = config.gifSection.imageSrc;
        video.load();
        document.getElementById('exit-pop-gif-text').textContent = config.gifSection.rightSideText;
        additionalTextSection.style.display = 'none';
        video.addEventListener('contextmenu', function(e) {
            e.preventDefault(); // This will prevent the default context menu
        });
    } else {
        gifSection.style.display = 'none';
        additionalTextSection.style.display = 'block';
        additionalTextSection.innerHTML = config.additionalText.content;
    }

    updateExitPopupLink();

    var popupOverlay = document.getElementById('exitpopup-overlay');
    fadeIn(popupOverlay, true, 'flex');

    // Set closeability
    if (closeable) {
        popupOverlay.addEventListener('click', closePopup);
    } else {
        popupOverlay.removeEventListener('click', closePopup);
    }

    isPopupShowed = true;

    var countdownElement = document.getElementById("exit-pop-countdown-time");
    if (countdownElement) {
        document.getElementById('exit-pop-countdown-time').textContent = config.countdownTime;
        setupTimer(countdownElement);
    }

}

function closePopup() {
    var popupOverlay = document.getElementById('exitpopup-overlay');

    clearInterval(timerId);

    // Hide popup and enable background contents
    fadeOut(popupOverlay, true, 'none');
    isPopupShowed = false;
}

function displayTime(durationInSeconds, countdownElement) {
    if (!countdownElement) {
        return;  // Exit the function if countdownElement is not defined
    }
    var minutes = Math.floor((durationInSeconds % 3600) / 60);
    var seconds = durationInSeconds % 60;

    // Format the time with leading zeros
    var formattedTime = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

    // Display the formatted time in the h2 element
    countdownElement.innerHTML = "" + formattedTime;
}

function startTimer(durationInSeconds, countdownElement) {
    // Update the timer display every second
    timerId = setInterval(function () {
        displayTime(durationInSeconds, countdownElement);  // Pass countdownElement

        // Decrement the duration by 1 second
        durationInSeconds--;

        // Stop the timer when the duration reaches 0
        if (durationInSeconds < 0) {
            clearInterval(timerId);
            if (countdownElement) {
                countdownElement.innerHTML = "00:00";
            }

            window.setVar('starttime', 0);
        }
    }, 1000); // Update every 1000 milliseconds (1 second)
}

function setupTimer(countdownElement) {
    var timeParts = config.countdownTime.split(":");
    var timerInterval = 0;
    for (var i = 0; i < timeParts.length; i++) {
        timerInterval = 60 * timerInterval + parseInt(timeParts[i], 10);
    }

    var tmrcntr = Date.now();
    var starttime = parseInt(window.getVar('starttime'), 10);
    if (starttime > 0) {
        tmrcntr = new Date(tmrcntr) - new Date(starttime);
    }

    var seconds = Math.floor(timerInterval - (tmrcntr / 1000));

    if (seconds > 0 && seconds < timerInterval) { // Continue time
        displayTime(seconds, countdownElement);
        startTimer(seconds, countdownElement);
    } else { // Reset time
        window.setVar('starttime', Date.now());
        displayTime(timerInterval, countdownElement);
        startTimer(timerInterval, countdownElement);
    }
}

function fadeIn(el, smooth, displayStyle) {
    smooth = (smooth !== undefined) ? smooth : true;
    displayStyle = displayStyle || 'block';

    el.style.opacity = 0;
    el.style.visibility = 'visible';



    if (smooth) {
        var opacity = 0;
        var request;

        var animation = function() {
            if (opacity === 0) {
                el.style.display = displayStyle;
                document.body.style.overflow = 'hidden';
                el.style.zIndex = 200000;
            }
            opacity = parseFloat(el.style.opacity) + 0.05;
            el.style.opacity = opacity;
            if (opacity >= 1) {
                opacity = 1;
                el.style.opacity = opacity;
                cancelAnimationFrame(request);
            }
        };

        var rAf = function() {
            request = requestAnimationFrame(rAf);
            animation();
        };
        rAf();
    } else {
        el.style.display = displayStyle;
        el.style.zIndex = 200000;
        document.body.style.overflow = 'hidden';
        el.style.opacity = 1;
    }
}

function fadeOut(el, smooth, displayStyle) {
    smooth = (smooth !== undefined) ? smooth : true;
    displayStyle = displayStyle || 'none';

    if (smooth) {
        var opacity = parseFloat(el.style.opacity);
        var request;

        var animation = function() {
            opacity -= 0.05;
            el.style.opacity = opacity;
            if (opacity <= 0) {
                opacity = 0;
                el.style.opacity = opacity;
                el.style.display = displayStyle;
                el.style.visibility = 'hidden';
                document.body.style.overflow = 'auto';
                el.style.zIndex = 'initial';
                cancelAnimationFrame(request);
            }
        };

        var rAf = function() {
            request = requestAnimationFrame(rAf);
            animation();
        };
        rAf();
    } else {
        el.style.opacity = 0;
        el.style.visibility = 'hidden';
        el.style.display = displayStyle;
        document.body.style.overflow = 'auto';
        el.style.zIndex = 'initial';
    }
}

document.addEventListener('mouseout', function(evt) {
    // Check if the mouse leaves the window
    if (evt.clientY < 0  && !isPopupShowed) {
        showPopup(false);
    }
});

if (wsFlags.isMobile && window.showExitPopByDefault ==true) {
    (function(window, location) {
        history.replaceState(null, document.title, location.pathname+"#!/history");
        history.pushState(null, document.title, location.pathname);

        window.addEventListener("popstate", function() {
            if(location.hash === "#!/history") {
                history.replaceState(null, document.title, location.pathname);
                setTimeout(function(){
                    //location.replace("<?php echo $after_bb; ?>");
                    showPopup(false);
                },0);
            }
        }, false);
    }(window, location));
}