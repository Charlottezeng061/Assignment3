// Get the controls and text elements from the HTML.
const playButton = document.getElementById("play");
const statusText = document.getElementById("status");
const playIcon = document.getElementById("play-icon");
const nowPlaying = document.getElementById("now-playing");
const intensity = document.getElementById("intensity");

// Create two audio layers for the full soundtrack.
// Use a separate audio element for a single-sound preview.
const genreAudio = new Audio();
const atmosphereAudio = new Audio();
const previewAudio = new Audio();

// Keep both soundtrack layers playing in a loop.
// The preview does not loop.
genreAudio.loop = true;
atmosphereAudio.loop = true;
previewAudio.loop = false;

/*
Audio credits — Freesound

Genre files: assets/audio/genre/

fantasy1.mp3 — Enchanted Lobby Loop
https://freesound.org/s/731511/
fantasy2.mp3 — Medieval Lute Chords
https://freesound.org/s/506266/
fantasy3.mp3 — Fantasy Ambience
https://freesound.org/s/277297/
fantasy4.mp3 — Final Phantomsee
https://freesound.org/s/807750/

mystery1.mp3 — Mysterious ambience
https://freesound.org/s/728725/
mystery2.mp3 — Suspense Strings
https://freesound.org/s/583732/
mystery3.mp3 — Atmosphere 2
https://freesound.org/s/384584/
mystery4.mp3 — Bright And Mystery
https://freesound.org/s/669503/

romance1.mp3 — Free Cinematic Emotional Piano
https://freesound.org/s/668907/
romance2.mp3 — Contemplative String Loop
https://freesound.org/s/839571/
romance3.mp3 — Lofi Loop 2023
https://freesound.org/s/673525/
romance4.mp3 — Murmuring Strings
https://freesound.org/s/847418/

sci-fi1.mp3 — Atmosphere_Scifi_Bunker_Loop_Stereo
https://freesound.org/s/817225/
sci-fi2.mp3 — Building Synth [Loop]
https://freesound.org/s/703050/
sci-fi3.mp3 — Sci-fi Ambient Drone
https://freesound.org/s/534018/
sci-fi4.mp3 — Sci-fi Space Traveling Ambient Suit
https://freesound.org/s/726484/

Atmosphere files: assets/audio/atmosphere/

calm1.mp3 — Rain_Ambience.WAV
https://freesound.org/s/704579/
calm2.mp3 — Ambience: Quiet Windy Forest
https://freesound.org/s/479430/
calm3.mp3 — Ocean Waves
https://freesound.org/s/531015/
calm4.mp3 — Fireplace Fire Crackling
https://freesound.org/s/717579/

dark1.mp3 — Dark Drone Ambient
https://freesound.org/s/500326/
dark2.mp3 — Dark Wind
https://freesound.org/s/440962/
dark3.mp3 — Dark Drone
https://freesound.org/s/728465/
dark4.mp3 — Cave Ambience Loop
https://freesound.org/s/770379/

magical1.mp3 — Luminis
https://freesound.org/s/722399/
magical2.mp3 — Magic - Chimes
https://freesound.org/s/753334/
magical3.mp3 — Magic - Cymbal Swell
https://freesound.org/s/826130/
magical4.mp3 — Recuperatio
https://freesound.org/s/722381/

nostalgic1.mp3 — Lofi E-Piano Loop 95 BPM
https://freesound.org/s/629167/
nostalgic2.mp3 — Memories - Nostalgic Simple Piano Melody
https://freesound.org/s/827125/
nostalgic3.mp3 — Brahms Lullaby Music Box
https://freesound.org/s/416384/
nostalgic4.mp3 — OldClock.wav
https://freesound.org/s/464747/
*/
const sounds = {
  Fantasy: { file: "fantasy", label: "Dreamlike" },
  Mystery: { file: "mystery", label: "Suspenseful" },
  Romance: { file: "romance", label: "Tender" },
  "Sci-Fi": { file: "sci-fi", label: "Otherworldly" },
  Calm: { file: "calm", label: "Quiet" },
  Dark: { file: "dark", label: "Shadowy" },
  Magical: { file: "magical", label: "Enchanted" },
  Nostalgic: { file: "nostalgic", label: "Reflective" }
};

// Set the starting selections and playback state.
let genre = "Fantasy";
let atmosphere = "Calm";
let isPlaying = false;

// Track time only while the soundtrack is playing.
const focusTime = document.getElementById("focus-time");

let focusElapsed = 0;
let focusStarted = null;
let focusTimer;

function updateFocusTime() {
  let elapsed = focusElapsed;

  if (focusStarted !== null) {
    elapsed += performance.now() - focusStarted;
  }

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  focusTime.textContent =
    "Focus time " +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
}

function startFocusTime() {
  if (focusStarted !== null) return;

  focusStarted = performance.now();
  focusTimer = setInterval(updateFocusTime, 1000);
  updateFocusTime();
}

function pauseFocusTime() {
  if (focusStarted !== null) {
    focusElapsed += performance.now() - focusStarted;
    focusStarted = null;
  }

  clearInterval(focusTimer);
  updateFocusTime();
}

// Use a request number to ignore old playback requests.
// This helps when the user changes sounds before loading finishes.
let request = 0;

// These timers control the click delay and preview length.
let clickTimer;
let previewTimer;

// Remember the current clip for every label.
// Each label starts with clip 1.
const clips = {};

Object.keys(sounds).forEach(function (name) {
  clips[name] = 1;
});

// Build the file path using the group, label, and clip number.
// For example: assets/audio/genre/fantasy2.mp3
function audioPath(type, name) {
  return (
    "assets/audio/" +
    type + "/" +
    sounds[name].file +
    clips[name] +
    ".mp3"
  );
}

// Load the selected files into the two soundtrack layers.
// Loading a file does not start playback.
function loadSounds() {
  genreAudio.src = audioPath("genre", genre);
  atmosphereAudio.src = audioPath("atmosphere", atmosphere);
}

function updateDisplay() {
  // Show the names in the player.
  nowPlaying.textContent = genre + " + " + atmosphere;

  document.querySelectorAll(".options button").forEach(function (button) {
    const name = button.dataset.name;
    const type = button.dataset.type;

    // Check whether this button is selected in its group.
    const selected =
      type === "genre" ? name === genre : name === atmosphere;

    button.classList.toggle("selected", selected);

    // Share the selected state with screen readers.
    button.setAttribute("aria-pressed", selected);

    // Show the current clip number inside the button.
// Highlight the button when its sound number changes.
const counter = button.querySelector(".sound-number");
const nextText = "Sound " + clips[name] + " / 4";

if (counter.textContent !== nextText) {
  counter.textContent = nextText;

  button.classList.remove("sound-changed");
  void button.offsetWidth;
  button.classList.add("sound-changed");
}
  });
}

// Pause all audio and clear any pending timers.
// Playback positions are kept so the soundtrack can resume.
function stopSounds() {
  pauseFocusTime();
  request++;

  clearTimeout(clickTimer);
  clearTimeout(previewTimer);

  genreAudio.pause();
  atmosphereAudio.pause();
  previewAudio.pause();

  // Remove the outline from any previewing button.
  document.querySelectorAll(".previewing").forEach(function (button) {
    button.classList.remove("previewing");
  });

  isPlaying = false;
  playButton.disabled = false;
// Show the play icon when audio is paused.
playIcon.src = "assets/icon/play.png";
playButton.setAttribute("aria-label", "Play soundtrack");
}

// Play the genre and atmosphere together.
async function startSounds() {
  // Stop any preview before starting the full soundtrack.
  stopSounds();

  const currentRequest = request;

  playButton.disabled = true;
  statusText.textContent = "Loading…";

  try {
    // Wait for both audio layers to start.
    await Promise.all([
      genreAudio.play(),
      atmosphereAudio.play()
    ]);

    // Ignore this result if a newer action has already happened.
    if (currentRequest !== request) return;

    isPlaying = true;
    startFocusTime();

    // Show the pause icon while audio is playing.
    playIcon.src = "assets/icon/pause.png";
    playButton.setAttribute("aria-label", "Pause soundtrack");
    statusText.textContent = "Now Playing";
  } catch {

    // Show an error only if this is still the current request.
    if (currentRequest !== request) return;

    stopSounds();
    statusText.textContent =
      "Could not play audio. Check your files.";
  } finally {

    // Enable the button after the current loading request finishes.
    if (currentRequest === request) {
      playButton.disabled = false;
    }
  }
}

// Select a label and preview one of its clips.
// nextClip is true for a double-click or right arrow key.
async function previewSound(button, nextClip) {
  // Stop the full soundtrack so the preview is easy to hear.
  stopSounds();

  const name = button.dataset.name;
  const type = button.dataset.type;

  if (type === "genre") {
    genre = name;
  } else {
    atmosphere = name;
  }

  // Move to the next clip when requested.
  // After clip 4, return to clip 1.
  if (nextClip) {
    clips[name] = (clips[name] % 4) + 1;
  }

  // Prepare the selected pair for the next press of Start.
  loadSounds();
  updateDisplay();

  // Play only the clicked label during the preview.
  previewAudio.src = audioPath(type, name);
  button.classList.add("previewing");
  statusText.textContent = "Previewing " + name;

  const currentRequest = request;

  try {
    await previewAudio.play();

    if (currentRequest !== request) return;

    // Stop the preview after six seconds.
    previewTimer = setTimeout(function () {
      stopSounds();
      statusText.textContent = "Ready to play";
    }, 6000);
  } catch {
    if (currentRequest !== request) return;

    stopSounds();
    statusText.textContent = "Could not preview this sound.";
  }
}

// Add labels and click events to one group of buttons.
function setupButtons(groupId, type) {
  const buttons =
    document.querySelectorAll("#" + groupId + " button");

  buttons.forEach(function (button) {
    // Read the original button name before adding extra text.
    const name = button.textContent.trim();

    button.dataset.name = name;
    button.dataset.type = type;


 // Show the sound name and current clip number.
button.innerHTML =
  '<strong class="sound-name">' + name + "</strong>" +
  '<span class="sound-number">Sound ' + clips[name] + " / 4</span>";

    button.title =
      "Click to preview · Double-click for next sound";

    button.addEventListener("click", function (event) {
      clearTimeout(clickTimer);

      // The double-click event will handle the second click.
      if (event.detail > 1) return;

      // Keyboard activation can preview immediately.
      if (event.detail === 0) {
        previewSound(button, false);
        return;
      }

      // Wait briefly to check whether another click follows.
      // This prevents a double-click from also starting a single-click preview.
      clickTimer = setTimeout(function () {
        previewSound(button, false);
      }, 400);
    });

    button.addEventListener("dblclick", function () {
      clearTimeout(clickTimer);
      previewSound(button, true);
    });

    // Allow keyboard users to change clips with the right arrow key.
    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        previewSound(button, true);
      }
    });
  });
}

// Set up both groups using the same button function.
setupButtons("genres", "genre");
setupButtons("atmospheres", "atmosphere");

// Use one button to start and pause the soundtrack.
playButton.addEventListener("click", function () {
  if (isPlaying) {
    stopSounds();
    statusText.textContent = "Paused";
  } else {
    startSounds();
  }
});

// Convert the percentage to a volume value and apply it to all audio.
function setIntensity() {
  const volume = Number(intensity.value) / 100;

  genreAudio.volume = volume;
  atmosphereAudio.volume = volume;
  previewAudio.volume = volume;

  document.getElementById("intensity-value").textContent =
    intensity.value + "%";
}

// Update the volume as the slider moves.
intensity.addEventListener("input", setIntensity);

// Pick a different clip from the other three available clips.
// A nonzero offset prevents choosing the current clip again.
function randomClip(currentClip) {
  const offset = 1 + Math.floor(Math.random() * 3);

  return ((currentClip - 1 + offset) % 4) + 1;
}

// Run this function when the Random button is clicked.
document.getElementById("random").addEventListener("click", function () {
  const wasPlaying = isPlaying;

  // Pause the soundtrack and any preview before changing files.
  stopSounds();

  // Pick a different clip within each selected label.
  // For example, clips[genre] means clips["Fantasy"] when Fantasy is the selected genre.
  // genre and atmosphere stay unchanged, so the buttons do not change.
  // randomClip() uses Math.random() to choose another clip.
  clips[genre] = randomClip(clips[genre]);
  clips[atmosphere] = randomClip(clips[atmosphere]);

  // Set the new audio file paths without starting playback.
  loadSounds();

  // Update the clip counters and selected button states.
  updateDisplay();

  statusText.textContent = "New sounds ready";

  // Play the new clips if the soundtrack was playing before.
  // Otherwise, wait for the user to press Start.
  if (wasPlaying) {
    startSounds();
  }
});

// Restore the starting sounds, volume and focus time.
document.getElementById("reset").addEventListener("click", function () {
  stopSounds();

  genre = "Fantasy";
  atmosphere = "Calm";

  Object.keys(clips).forEach(function (name) {
    clips[name] = 1;
  });

  intensity.value = 50;
  setIntensity();

  focusElapsed = 0;
  updateFocusTime();

  loadSounds();
  updateDisplay();

  statusText.textContent = "Ready to play";
});

// The ended event fires when the preview reaches the end of its file.
// This handles clips that finish before the six-second timer.
// Pausing a preview does not fire this event.
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event
previewAudio.addEventListener("ended", function () {
  // Clear the preview timer and remove the preview outline.
  stopSounds();

  // Return the interface to its ready state.
  statusText.textContent = "Ready to play";
});

// These functions run once when the script loads.
// Prepare the default files, button states, and volume.
// Audio stays paused until the user starts playback or a preview.
loadSounds();
updateDisplay();
setIntensity();

const themeButton = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// Change the theme and show the icon for the next mode.
themeButton.addEventListener("click", function () {
  const isDayMode = document.body.classList.toggle("day-mode");

  themeIcon.src = isDayMode
    ? "assets/icon/night.png"
    : "assets/icon/day.png";

  const label = isDayMode
    ? "Switch to night mode"
    : "Switch to day mode";

  themeButton.setAttribute("aria-label", label);
  themeButton.setAttribute("title", label);
  themeButton.setAttribute("aria-pressed", isDayMode);
});


// Show one guide step at a time.
// Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
const guide = document.getElementById("guide");
const guideOpen = document.getElementById("guide-open");
const guideClose = document.getElementById("guide-close");
const guideBack = document.getElementById("guide-back");
const guideNext = document.getElementById("guide-next");
const guideTitle = document.getElementById("guide-title");
const guideText = document.getElementById("guide-text");
const guideProgress = document.getElementById("guide-progress");

const guideSteps = [
  {
    title: "Choose your sounds",
    text: "Choose a genre and an atmosphere. Click a button to hear a 6-second preview."
  },
  {
    title: "Try another sound",
    text: "Each button has 4 sounds. Double-click to hear the next one. “Sound 1 / 4” shows your current sound. You can also select a button and press →."
  },
  {
  title: "Start reading",
  text: `
    <span class="guide-icon">
      <img src="assets/icon/play.png" alt="Play">
    </span>
    Play both layers. Sounds loop automatically.
    <br><br>

    <span class="guide-icon">
      <img src="assets/icon/random.png" alt="Random">
    </span>
    Try new sounds in your chosen categories.
    <br><br>

    <span class="guide-icon">
      <img src="assets/icon/reset.png" alt="Reset">
    </span>
    Restore your sounds, volume and focus time.
     <br><br>
    Focus time counts while your soundtrack plays and pauses with it.
  `
}
];

let guideStep = 0;

// Update the text and navigation for the current step.
function updateGuide() {
  guideTitle.textContent = guideSteps[guideStep].title;
  guideText.innerHTML = guideSteps[guideStep].text;

  guideProgress.textContent =
    "Step " + (guideStep + 1) + " of " + guideSteps.length;

  guideBack.disabled = guideStep === 0;

  guideNext.textContent =
    guideStep === guideSteps.length - 1 ? "Got it" : "Next";
}

// Pause audio and start the guide from step 1.
function openGuide() {
  const wasPlaying = isPlaying;

  stopSounds();
  statusText.textContent = wasPlaying ? "Paused" : "Ready to play";

  guideStep = 0;
  updateGuide();

  if (!guide.open) {
    guide.showModal();
  }
}

guideOpen.addEventListener("click", openGuide);

guideBack.addEventListener("click", function () {
  if (guideStep > 0) {
    guideStep--;
    updateGuide();
  }
});

guideNext.addEventListener("click", function () {
  if (guideStep < guideSteps.length - 1) {
    guideStep++;
    updateGuide();
  } else {
    guide.close();
  }
});

guideClose.addEventListener("click", function () {
  guide.close();
});

// Return focus to the help button after closing.
guide.addEventListener("close", function () {
  guideOpen.focus();
});

// Show the guide every time the page loads.
openGuide();

// Update the player after both soundtrack layers finish.
function checkTrackEnd() {
  if (
    isPlaying &&
    genreAudio.ended &&
    atmosphereAudio.ended
  ) {
    stopSounds();
    statusText.textContent = "Finished";
  }
}

genreAudio.addEventListener("ended", checkTrackEnd);
atmosphereAudio.addEventListener("ended", checkTrackEnd);