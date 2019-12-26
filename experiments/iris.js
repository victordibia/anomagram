// const tf = require('@tensorflow/tfjs');
const _ = require('lodash');
const tf = require('@tensorflow/tfjs-node');

iris = require("./data/iris.json")
iris = _.shuffle(iris)
iris_train = iris.slice(0, 130)
iris_test = iris.slice(130, iris.length)

const trainingData = tf.tensor2d(iris_train.map(item => [
    item.sepalLength, item.sepalWidth, item.petalLength, item.petalWidth
]
), [iris_train.length, 4])

const testData = tf.tensor2d(iris_test.map(item => [
    item.sepalLength, item.sepalWidth, item.petalLength, item.petalWidth
]
), [iris_test.length, 4])

const outputData = tf.tensor2d(iris_train.map(item => [
    item.species === 'setosa' ? 1 : 0,
    item.species === 'virginica' ? 1 : 0,
    item.species === 'versicolor' ? 1 : 0

]), [iris_train.length, 3])

const y_test = tf.tensor2d(iris_test.map(item => [
    item.species === 'setosa' ? 1 : 0,
    item.species === 'virginica' ? 1 : 0,
    item.species === 'versicolor' ? 1 : 0

]), [iris_test.length, 3])

const model = tf.sequential();

model.add(tf.layers.dense({
    inputShape: [4],
    activation: "sigmoid",
    units: 10,
    name: "layer1"
}))

model.add(tf.layers.dense({
    inputShape: [10],
    activation: "softmax",
    units: 3,
    name: "layer2"
}))

model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.adam(),
    metrics: ['accuracy'],
})

model.summary()

async function train_data() {
    for (let i = 0; i < 15; i++) {
        const res = await model.fit(trainingData,
            outputData, { epochs: 60 });
        console.log(res.history.loss[0]);
    }
}

async function main() {
    let train = await train_data();

    let preds = await model.predict(testData)
    preds_max = preds.argMax(1)
    preds_max.print()
    y_test.argMax(1).print()
    console.log();

    result = await model.evaluate(testData, y_test)
    console.log(result.print());

}
main()
