// Craft an autoencoder

// const tf = require('@tensorflow/tfjs');
const _ = require('lodash');
const tf = require('@tensorflow/tfjs-node');



let buildModel = function (params) {

    const numFeatures = params.numFeatures    // Set feaetures to size of features
    const hiddenLayers = params.hiddenLayers
    const latentDim = params.latentDim
    const hiddenDim = params.hiddenDim
    const learningRate = params.learningRate, adamBeta1 = params.adamBeta1
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




    //  enc_hidden = Dense(hidden_dim[0], activation='relu', name='encoder_hidden_0')(inputs)
    // i = 1
    // while i < hidden_layers:
    //     enc_hidden = Dense(hidden_dim[i],activation='relu',name='encoder_hidden_'+str(i))(enc_hidden)
    //     i+=1




    // Specify decoder
    // const latentInput = tf.input({ shape: [latentDim] })
    // let decoderHidden = tf.layers.dense({ units: 7, activation: "relu" }).apply(latentInput);
    // decoderHidden = tf.layers.dense({ units: 15, activation: "relu" }).apply(decoderHidden);
    // const decoderOutput = tf.layers.dense({ units: numFeatures }).apply(decoderHidden);
    // const decoder = tf.model({ inputs: latentInput, outputs: decoderOutput, name: "decoder" })

    const latentInput = tf.input({ shape: [latentDim] })
    let decoderHidden = tf.layers.dense({ units: hiddenDim[hiddenDim.length - 1], activation: "relu" }).apply(latentInput);
    let j = hiddenDim.length - 2
    while (i > 0) {
        decoderHidden = tf.layers.dense({ units: hiddenDim[j], activation: "relu" }).apply(decoderHidden);
        i--;
    }

    const decoderOutput = tf.layers.dense({ units: numFeatures }).apply(decoderHidden);
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