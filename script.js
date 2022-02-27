const imageUpload = document.getElementById('imageUpload')

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
    const container = document.createElement('div')
    container.className = 'img-container';
    document.body.append(container)
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, .6)
    let image
    let canvas
    document.querySelector('#loader').style.display = 'none';
    imageUpload.addEventListener('change', async () => {
        if (image) image.remove()
        if (canvas) canvas.remove()
        image = await faceapi.bufferToImage(imageUpload.files[0])
        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)
        const displaySize = {
            width: image.width,
            height: image.height
        }
        container.style.width = image.width +'px'
        container.style.height = image.height+'px'
        faceapi.matchDimensions(canvas, displaySize)
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result.toString()
            })
            drawBox.draw(canvas)
        })

    })
}

function loadLabeledImages() {
    const labels = ['Tom Brady']
    return Promise.all(
        labels.map(async label => {
            var typeImage;
            const descriptions = []
            for (let i = 1; i <= 4; i++) {

                if (i == 1 || i == 4) {
                    typeImage = 'png';
                } else {
                    typeImage = 'jpg'
                }
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/anti-duhring/JavaScript-face-recognition-/main/labeled_images/${label}/${i}.${typeImage}`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            return new faceapi.LabeledFaceDescriptors('This is the GOAT', descriptions)
        })
    )
}
