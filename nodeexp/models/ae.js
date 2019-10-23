// Craft an autoencoder

// const tf = require('@tensorflow/tfjs');
const _ = require('lodash');
const tf = require('@tensorflow/tfjs-node');

const numFeatures = ecgTrain[0].data.length    // Set feaetures to size of features
const hiddenLayers = 2
const latentDim = 2
const hiddenDim = [15, 7]
const learningRate = 0.001, adamBeta1 = 0.5


// Specify encoder 
const input = tf.input({ shape: [numFeatures] })
let encoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(input);
encoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(encoderHidden);
const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
const encoder = tf.model({ inputs: input, outputs: z_, name:"encoder" })


// Specify decoder
const latentInput = tf.input({ shape: [latentDim] })
let decoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(latentInput);
decoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(decoderHidden);
const decoderOutput = tf.layers.dense({ units: numFeatures }).apply(decoderHidden);
const decoder = tf.model({ inputs: latentInput, outputs: decoderOutput , name:"decoder"})

// link output of ender to decoder 
output = decoder.apply(encoder.apply(input))

// Construct AE with both encoder and decoder
const ae = tf.model({ inputs: input, outputs: output, name: "autoencoder" })
const optimizer = tf.train.adam(learningRate, adamBeta1)

ae.compile({optimizer: optimizer,loss: "meanSquaredError"})

// encoder.summary()
// decoder.summary()
// ae.summary()

module.exports = {
    autoencoder: ae,
    encoder: encoder,
    decoder: decoder
}