const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { filePath } = require("fs");

const videoElement = document.querySelector("video");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const videoSelectBtn = document.querySelector("#videoSelectBtn");

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

videoSelectBtn.onclick = getVideoSources;
startBtn.onclick = () => {
  startBtn.classList.add("red");
  startBtn.classList.add("disabled")
  startBtn.innerText = "Recording";
};

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
  const recorderOptions = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, recorderOptions);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  wrtieFile(filePath, buffer, () => console.log("Video Saved Successfuly"));
}