// Craft an autoencoder

// const tf = require('@tensorflow/tfjs');
// Craft an autoencoder

const tf = require('@tensorflow/tfjs');
// const _ = require('lodash');



export function buildModel(params) {

    const numFeatures = params.numFeatures    // Set feaetures to size of features 
    const latentDim = params.latentDim
    const hiddenDim = params.hiddenDim
    const outputActivation = params.outputActivation

    // console.log(numFeatures);


    // Specify encoder 
    // const input = tf.input({ shape: [numFeatures] })
    // let encoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(input);
    // encoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(encoderHidden);
    // const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
    // const encoder = tf.model({ inputs: input, outputs: z_, name: "encoder" })

    const input = tf.input({ shape: [numFeatures] })
    let encoderHidden = tf.layers.dense({ units: hiddenDim[0], activation: "relu" }).apply(input);
    let i = 1
    while (i < hiddenDim.length) {
        encoderHidden = tf.layers.dense({ units: hiddenDim[i], activation: "relu" }).apply(encoderHidden);
        i++
    }
    const z_ = tf.layers.dense({ units: latentDim }).apply(encoderHidden);
    const encoder = tf.model({ inputs: input, outputs: z_, name: "encoder" })



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
    let output = decoder.apply(encoder.apply(input))

    // Construct AE with both encoder and decoder
    const ae = tf.model({ inputs: input, outputs: output, name: "autoencoder" })


    ae.compile({ optimizer: params.optimizer, loss: "meanSquaredError", metrics: ["accuracy"] })
    return ae
}


