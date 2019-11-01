

const getEcgData = function () {
    let ecgTrain = require("./../../app/public/data/ecg/train_scaled.json")
    let testEcg = require("./../../app/public/data/ecg/test_scaled.json")
    let trainEcg = []
    for (row in ecgTrain) {
        let val = ecgTrain[row]
        if (val.target + "" === 1 + "") {
            trainEcg.push(val)
        }
    }
    console.log("inliers", trainEcg.length, testEcg.length);
    return [trainEcg, testEcg]

}

module.exports = {
    getEcgData: getEcgData
}