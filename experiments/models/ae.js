/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 * This module defines and returns an autoencoder model.
 */


// Craft an autoencoder
const _ = require('lodash');
const tf = require('@tensorflow/tfjs-node');



let buildModel = function (params) {

    const numFeatures = params.numFeatures    // Set feaetures to size of features
    const hiddenLayers = params.hiddenLayers
    const latentDim = params.latentDim
    const hiddenDim = params.hiddenDim
    const learningRate = params.learningRate, adamBeta1 = params.adamBeta1
    const outputActivation = "sigmoid"
    // console.log(numFeatures);

    // Specify encoder
    const input = tf.input({ shape: [numFeatures] })
    let encoderHidden = tf.layers.dense({ units: hiddenDim[0], activation: "relu" }).apply(input);
    let i = 1
    while (i < hiddenDim.length) {
        encoderHidden = tf.layers.dense({ units: hiddenDim[i], activation: "relu" }).apply(encoderHidden);
        i++
    }
    const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
    const encoder = tf.model({ inputs: input, outputs: z_, name: "encoder" })


    // Specify decoder
    const latentInput = tf.input({ shape: [latentDim] })
    let decoderHidden = tf.layers.dense({ units: hiddenDim[hiddenDim.length - 1], activation: "relu" }).apply(latentInput);
    let j = hiddenDim.length - 1
    while (j > 0) {
        j--;
        decoderHidden = tf.layers.dense({ units: hiddenDim[j], activation: "relu" }).apply(decoderHidden);

    }

    const decoderOutput = tf.layers.dense({ units: numFeatures, activation: outputActivation }).apply(decoderHidden);
    const decoder = tf.model({ inputs: latentInput, outputs: decoderOutput, name: "decoder" })

    // link output of ender to decoder 
    output = decoder.apply(encoder.apply(input))

    // Construct AE with both encoder and decoder
    const ae = tf.model({ inputs: input, outputs: output, name: "autoencoder" })
    const optimizer = tf.train.adam(learningRate, adamBeta1)

    ae.compile({ optimizer: optimizer, loss: "meanSquaredError" })

    return [ae, encoder, decoder]
}




module.exports = {
    buildModel: buildModel
}