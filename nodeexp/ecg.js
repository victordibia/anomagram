
// const tf = require('@tensorflow/tfjs'); 
const tf = require('@tensorflow/tfjs-node');
const _ = require('lodash');
const dataUtils = require("./utils/data.js")
const ae_model = require("./models/ae.js")

// Fetch data using data util
let trainEcg, testEcg;
[trainEcg, testEcg] = dataUtils.getEcgData()

let modelParams = {
    numFeatures: trainEcg[0].data.length,
    hiddenLayers: 2,
    latentDim: 2,
    hiddenDim: [15, 7],
    learningRate: 0.005,
    adamBeta1: 0.5
}

let numSteps = 30
let numEpochs = 30
let batchSize = 256

let modelSavePath = "file://./webmodel/ecg"

let model, encoder, decoder
[model, encoder, decoder] = ae_model.buildModel(modelParams)

// ae.summary() 


console.log(" >> Train/Test Split | Train:", trainEcg.length, " Test:", testEcg.length);
// console.log(" >> Features per data point ", ecg[0].data.length)
// console.log(trainEcg[0]);


const xs = tf.tensor2d(trainEcg.map(item => item.data
), [trainEcg.length, trainEcg[0].data.length])

const xsTest = tf.tensor2d(testEcg.map(item => item.data
), [testEcg.length, testEcg[0].data.length])

yTest = testEcg.map(item => item.target + "" === 1 + "" ? 0 : 1)



// console.log(xs, xsTest);


async function train_data() {
    for (let i = 0; i < numSteps; i++) {
        const res = await model.fit(xs,
            xs, { epochs: numEpochs, verbose: 0, batchSize: batchSize });
        console.log("Step loss", i, res.history.loss[0]);
    }

    await model.save(modelSavePath);


}

let out_hold = []

async function main() {
    let train = await train_data();

    let preds = await model.predict(xsTest)
    console.log(xsTest.shape, preds.shape)
    mse = tf.sub(preds, xsTest).square().mean(1).mul(1000) //tf.losses.meanSquaredError(preds, xsTest)
    // mse = tf.losses.meanSquaredError(preds, xsTest, 1)
    // mse.print()

    mse.array().then(array => {
        array.forEach((element, i) => {
            // console.log({ "mse": element, "label": yTest[i] });
            out_hold.push({ "mse": element, "label": yTest[i] })
            // console.log(out_hold.length)
        });
        out_hold = _.sortBy(out_hold, 'mse');
        // console.log(out_hold);
    });
    // 

    console.log("mse", mse.shape);


}
main()