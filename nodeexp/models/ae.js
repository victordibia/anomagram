// Craft an autoencoder

// const tf = require('@tensorflow/tfjs');
const _ = require('lodash');
const tf = require('@tensorflow/tfjs-node');



let buildModel = function (params) {

    const numFeatures = params.numFeatures    // Set feaetures to size of features
    const hiddenLayers = params.hiddenLayers
    const latentDim = params.latentDim
    const hiddenDim = params.hiddenLayers
    const learningRate = params.learningRate, adamBeta1 = params.adamBeta1
    // console.log(numFeatures);


    // Specify encoder 
    const input = tf.input({ shape: [numFeatures] })
    let encoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(input);
    encoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(encoderHidden);
    const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
    const encoder = tf.model({ inputs: input, outputs: z_, name: "encoder" })


    // Specify decoder
    const latentInput = tf.input({ shape: [latentDim] })
    let decoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(latentInput);
    decoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(decoderHidden);
    const decoderOutput = tf.layers.dense({ units: numFeatures }).apply(decoderHidden);
    const decoder = tf.model({ inputs: latentInput, outputs: decoderOutput, name: "decoder" })

    // link output of ender to decoder 
    output = decoder.apply(encoder.apply(input))

    // Construct AE with both encoder and decoder
    const ae = tf.model({ inputs: input, outputs: output, name: "autoencoder" })
    const optimizer = tf.train.adam(learningRate, adamBeta1)

    ae.compile({ optimizer: optimizer, loss: "meanSquaredError" })

    return [ae, encoder, decoderHidden]
}




module.exports = {
    buildModel: buildModel
}