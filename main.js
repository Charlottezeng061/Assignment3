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

// Match each button name to its audio file prefix.
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
    button.querySelector(".sound-number").textContent =
        "Sound " + clips[name] + " / 4";
  });
}

// Pause all audio and clear any pending timers.
// Playback positions are kept so the soundtrack can resume.
function stopSounds() {
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

// Restore the starting selections and settings when Reset is clicked.
document.getElementById("reset").addEventListener("click", function () {
  // Pause all audio and clear the preview and click timers.
  stopSounds();

  // Reset repeat to its starting state.
  isRepeat = false;
  updateRepeat();

  // Restore the default genre and atmosphere.
  genre = "Fantasy";
  atmosphere = "Calm";

  // Object.keys() creates an array of all label names in clips.
  // forEach() goes through each name and resets its clip number to 1.
  // This resets all eight labels, including unselected ones.
  // References:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
  Object.keys(clips).forEach(function (name) {
    clips[name] = 1;
  });

  // Return the slider to its starting value.
  intensity.value = 50;

  // Update the audio volume and percentage text.
  // Changing the slider value in code does not fire an input event,
  // so setIntensity() must be called here.
  setIntensity();

  // Load the default clips from the beginning.
  loadSounds();

  // Update the selected buttons, clip counters, and sound names.
  updateDisplay();

  // Reset prepares the soundtrack but does not play it.
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

const repeatButton = document.getElementById("repeat");
let isRepeat = false;

// Update looping and the repeat button state.
function updateRepeat() {
  genreAudio.loop = isRepeat;
  atmosphereAudio.loop = isRepeat;
  previewAudio.loop = false;

  repeatButton.setAttribute("aria-pressed", isRepeat);
  repeatButton.setAttribute(
    "title",
    isRepeat ? "Repeat on" : "Repeat off"
  );
}

// Toggle repeat when the button is clicked.
repeatButton.addEventListener("click", function () {
  isRepeat = !isRepeat;
  updateRepeat();
});

updateRepeat();


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
    text: "Each button has 4 sounds. Double-click to try the next one. “Sound 1 / 4” means sound 1 of 4. With a button focused, you can also press →."
  },
  {
    title: "Start reading",
    text: "Press Play to hear both layers and adjust the volume. Random tries new sounds in your chosen categories. Repeat keeps them looping."
  }
];

let guideStep = 0;

// Update the text and navigation for the current step.
function updateGuide() {
  guideTitle.textContent = guideSteps[guideStep].title;
  guideText.textContent = guideSteps[guideStep].text;

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

// Remember dismissal and return focus to the help button.
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
guide.addEventListener("close", function () {
  try {
    localStorage.setItem("soundtrack-guide-v2-seen", "true");
  } catch {
    // The guide still works without browser storage.
  }

  guideOpen.focus();
});

// Show this updated guide once on the first visit.
let hasSeenGuide = false;

try {
  hasSeenGuide =
    localStorage.getItem("soundtrack-guide-v2-seen") === "true";
} catch {
  // Show the guide if saved preferences cannot be read.
}

if (!hasSeenGuide) {
  openGuide();
}

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