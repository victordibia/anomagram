

const dataUtils = require("./utils/data.js")
const autoencoder = require("./models/ae.js")

// Fetch data using data util
let trainEcg, testEcg;
[trainEcg, testEcg] = dataUtils.getEcgData()



// numTrain = Math.round( 0.8 * ecg.length)
// trainEcg = ecg.slice(0, numTrain)
// testEcg = ecg.slice(numTrain, ecg.length)
// console.log(" >> Train/Test Split | Train:", trainEcg.length, " Test:", testEcg.length);
// console.log (" >> Features per data point ",ecg[0].data.length)
 


// const xs = tf.tensor2d(trainEcg.map(item => item.data
// ), [trainEcg.length, ecg[0].data.length])

// const xsTest = tf.tensor2d(testEcg.map(item => item.data
// ), [testEcg.length, ecg[0].data.length])



// async function train_data() {
//     for (let i = 0; i < 15; i++) {
//         const res = await ae.fit(xs,
//             xs, { epochs: 60 });
//         console.log(res.history.loss[0]);
//     }
// }

// async function main() {
//     let train = await train_data();

//     // let preds = await model.predict(testData)
//     // preds_max = preds.argMax(1)
//     // preds_max.print()
//     // y_test.argMax(1).print()
//     // console.log();

//     // result = await model.evaluate(testData, y_test)
//     // console.log(result.print());

// }
// // main()
