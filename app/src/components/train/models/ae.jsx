/**
 * @license
 * Copyright 2019 Victor Dibia. https://github.com/victordibia
 * Anomagram - Anomagram: Anomaly Detection with Autoencoders in the Browser.
 * Licensed under the MIT License (the "License"); 
 * =============================================================================
 */


// Craft an autoencoder
const tf = require('@tensorflow/tfjs');

export function buildModel(params) {

    const numFeatures = params.numFeatures    // Set feaetures to size of features 
    const latentDim = params.latentDim
    const hiddenDim = params.hiddenDim
    const outputActivation = params.outputActivation
    const regularizationRate = params.regularizationRate
    let layerRegularizer = null

    if (params.regularizer === "l1") {
        layerRegularizer = tf.regularizers.l1({ l1: regularizationRate })

    } else if (params.regularizer === "l2") {
        layerRegularizer = tf.regularizers.l2({ l2: regularizationRate })

    } else if (params.regularizer === "l1l2") {
        layerRegularizer = tf.regularizers.l1l2({ l1: regularizationRate, l2: regularizationRate })
    }


    // Specify encoder 
    const input = tf.input({ shape: [numFeatures] })
    let encoderHidden = tf.layers.dense({ units: hiddenDim[0], activation: "relu", kernelRegularizer: layerRegularizer }).apply(input);
    let i = 1
    while (i < hiddenDim.length) {
        encoderHidden = tf.layers.dense({ units: hiddenDim[i], activation: "relu", kernelRegularizer: layerRegularizer }).apply(encoderHidden);
        i++
    }
    const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
    const encoder = tf.model({ inputs: input, outputs: z_, name: "encoder" })


    // Specify decoder 
    const latentInput = tf.input({ shape: [latentDim] })
    let decoderHidden = tf.layers.dense({ units: hiddenDim[hiddenDim.length - 1], activation: "relu", kernelRegularizer: layerRegularizer }).apply(latentInput);
    let j = hiddenDim.length - 1
    while (j > 0) {
        j--;
        decoderHidden = tf.layers.dense({ units: hiddenDim[j], activation: "relu", kernelRegularizer: layerRegularizer }).apply(decoderHidden);

    }
    const decoderOutput = tf.layers.dense({ units: numFeatures, activation: outputActivation }).apply(decoderHidden);
    const decoder = tf.model({ inputs: latentInput, outputs: decoderOutput, name: "decoder" })

    // link output of encoder to decoder 
    let output = decoder.apply(encoder.apply(input))

    // Construct AE with both encoder and decoder
    const ae = tf.model({ inputs: input, outputs: output, name: "autoencoder" })

    // Compile with optimizer .. and we are done!
    ae.compile({ optimizer: params.optimizer, loss: "meanSquaredError" })
    return ae
}


