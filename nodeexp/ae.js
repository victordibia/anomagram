// Craft an autoencoder

// const tf = require('@tensorflow/tfjs');
const _ = require('lodash');
const tf = require('@tensorflow/tfjs-node');


const numFeatures = 4
const hiddenLayers = 2
const latentDim = 2
const hiddenDim = [15, 7]
const learningRate = 0.001, adamBeta1 = 0.5


// Specify encoder 
const input = tf.input({ shape: [numFeatures] })
let encoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(input);
encoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(encoderHidden);
const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
const encoder = tf.model({ inputs: input, outputs: z_ })


// Specify decoder
const latentInput = tf.input({ shape: [latentDim] })
let decoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(latentInput);
decoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(decoderHidden);
const decoderOutput = tf.layers.dense({ units: numFeatures }).apply(decoderHidden);
const decoder = tf.model({ inputs: latentInput, outputs: decoderOutput })

// link output of ender to decoder 
output = decoder.apply(encoder.apply(input))

// Construct AE with both encoder and decoder
const ae = tf.model({ inputs: input, outputs: output, name: "autoencoder" })
const optimizer = tf.train.adam(learningRate, adamBeta1)

ae.compile({
    optimizer: optimizer,
    loss: "meanSquaredError"
})

// encoder.summary()
// decoder.summary()
// ae.summary()

ecg = require("./../app/public/data/ecg/train_small_scaled.json")
ecg = _.shuffle(ecg)
numTrain = Math.round( 0.8 * ecg.length)
trainEcg = ecg.slice(0, numTrain)
testEcg = ecg.slice(numTrain, ecg.length)
console.log(" >> Train/Test Split | Train:", trainEcg.length, " Test:", testEcg.length);
console.log (" >> Features per data point ",ecg[0].data.length)
 


const xs = tf.tensor2d(trainEcg.map(item => item.data
), [trainEcg.length, ecg[0].data.length])

// const testData = tf.tensor2d(iris_test.map(item => [
//     item.sepalLength, item.sepalWidth, item.petalLength, item.petalWidth
// ]
// ), [iris_test.length, 4])

// const outputData = tf.tensor2d(iris_train.map(item => [
//     item.species === 'setosa' ? 1 : 0,
//     item.species === 'virginica' ? 1 : 0,
//     item.species === 'versicolor' ? 1 : 0

// ]), [iris_train.length, 3])

// const y_test = tf.tensor2d(iris_test.map(item => [
//     item.species === 'setosa' ? 1 : 0,
//     item.species === 'virginica' ? 1 : 0,
//     item.species === 'versicolor' ? 1 : 0

// ]), [iris_test.length, 3])

// const model = tf.sequential();

// model.add(tf.layers.dense({
//     inputShape: [4],
//     activation: "sigmoid",
//     units: 10,
//     name: "layer1"
// }))

// model.add(tf.layers.dense({
//     inputShape: [10],
//     activation: "softmax",
//     units: 3,
//     name: "layer2"
// }))

// model.compile({
//     loss: "categoricalCrossentropy",
//     optimizer: tf.train.adam(),
//     metrics: ['accuracy'],
// })

// model.summary()

// async function train_data() {
//     for (let i = 0; i < 15; i++) {
//         const res = await model.fit(trainingData,
//             outputData, { epochs: 60 });
//         console.log(res.history.loss[0]);
//     }
// }

// async function main() {
//     let train = await train_data();

//     let preds = await model.predict(testData)
//     preds_max = preds.argMax(1)
//     preds_max.print()
//     y_test.argMax(1).print()
//     console.log();

//     result = await model.evaluate(testData, y_test)
//     console.log(result.print());

// }
// main()
