const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { writeFile } = require("fs");

const videoMimeType = "video/webm; codecs=vp9";
const videoElement = document.querySelector("video");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const videoSelectBtn = document.querySelector("#videoSelectBtn");

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

videoSelectBtn.onclick = getVideoSources;

startBtn.onclick = () => {
  if(mediaRecorder) {
    mediaRecorder.start();
  }
};

stopBtn.onclick = () => { 
  if(mediaRecorder) {
    mediaRecorder.stop();
  }
}

// get available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"]
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => ({
      label: source.name,
      click: () => selectSource(source)
    }))
  )

  videoOptionsMenu.popup();
}

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;
  // make controls enabled to use once we select a source
  if(startBtn.classList.contains("disabled")) {
    startBtn.classList.remove("disabled");
  }
  if(stopBtn.classList.contains("disabled")) {
    stopBtn.classList.remove("disabled");
  }

  const contstrains = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  // create a stream
  const stream = await navigator.mediaDevices.getUserMedia(contstrains);
  
  // preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = () => videoElement.play();
  
  // create the Media Recorder
  const recorderOptions = { mimeType: videoMimeType };
  mediaRecorder = new MediaRecorder(stream, recorderOptions);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.onstart = handleStart;
}

function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

async function handleStart(e) {
  startBtn.classList.add("red");
  startBtn.innerText = "Recording";
}

async function handleStop(e) {
  startBtn.classList.remove("red");
  startBtn.innerText = "Start";

  const blob = new Blob(recordedChunks, { type: videoMimeType });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({ buttonLabel: "Save Video", defaultPath: `vid-${Date.now()}.webm` });

  writeFile(filePath, buffer, () => console.log("Video Saved Successfuly"));
}