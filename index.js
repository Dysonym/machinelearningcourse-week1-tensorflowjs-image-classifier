let net;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

const videoElement = document.getElementById('video');
const imgEl = document.getElementById('img');


async function setupWebcam() {
  return new Promise((resolve, reject) => {
    console.log("In Promise");
    const navigatorAny = navigator;
    navigator.getUserMedia = navigator.getUserMedia ||
        navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
        navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: true},
        stream => {
          videoElement.srcObject = stream;
          videoElement.addEventListener('loadeddata',  () => {console.log("resolve"); return resolve()}, false);
        },
        error => {console.log("reject"); return reject("No Webcam")});
    } else {
      reject("No getUserMedia");
    }
  });
}

async function app() {
  console.log('Loading mobilenet..');
  // Load the model.
  net = await mobilenet.load();
  const classifier = knnClassifier.create();
  console.log('Sucessfully loaded model');
  //console.log(net);
  
  // Make a prediction through the model on our image.

  const result = await net.classify(imgEl);
  console.log(JSON.stringify(result));
  console.log(document.getElementById('dog_prediction'));
  document.getElementById('dog_prediction').innerText = JSON.stringify(result, null, 2);
  
  // Reads an image from the webcam and associates it with a specific class
  // index.
  const addExample = classId => {
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    const activation = net.infer(videoElement, 'conv_preds');

    // Pass the intermediate activation to the classifier.
    classifier.addExample(activation, classId);
  };
  
  // When clicking a button, add an example for that class.
  document.querySelectorAll("button").forEach(button => {
    button.addEventListener('click', (event) => addExample(event.target.innerHTML));
  });
  
  
  console.log(videoElement);
  await setupWebcam();
  while (true) {
    
    /* //Classifying straigth with Mobinet
    const result = await net.classify(videoElement);
    document.getElementById('console').innerText = `
      prediction1: ${result[0].className}\n
      probability1: ${result[0].probability}\n
      prediction2: ${result[1].className}\n
      probability2: ${result[1].probability}\n
      prediction3: ${result[2].className}\n
      probability3: ${result[2].probability}\n
    `;
    */
    
    if (classifier.getNumClasses() > 0) {
      // Get the activation from mobilenet from the webcam.
      const activation = net.infer(videoElement, 'conv_preds');
      // Get the most likely class and confidences from the classifier module.
      const result = await classifier.predictClass(activation);
      
      //console.log(result);
      document.getElementById('console').innerText = `
        prediction: ${result.label}\n
        probability: ${result.confidences[result.label]}
      `;
    }

    // Give some breathing room by waiting for the next animation frame to
    // fire.
    await tf.nextFrame();
  }


}

app();
