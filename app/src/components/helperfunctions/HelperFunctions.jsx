// import { ToastNotification } from "carbon-components-react"

export function showToast(type, message, duration = 4000) {
    let notifbox = document.getElementById("notificatiionbox")
    let notif = document.createElement('div');
    notif.className = "notificationinner"
    notif.innerHTML = "" + message
    notifbox.append(notif)
    notif.style.opacity = 1
    // console.log(notifbox);

    setTimeout(() => {
        // notif.remove()
        notif.style.opacity = 0
        setTimeout(() => {
            notif.remove()
        }, 1500);
    }, duration);

}

export function computeAccuracyGivenThreshold(data, threshold) {

    let predVal = 0
    let truePositive = 0
    let trueNegative = 0
    let falsePositive = 0
    let falseNegative = 0

    let ac = 0

    data.forEach(each => {
        predVal = each.mse > threshold ? 1 : 0

        if (each.label === predVal) {
            ac++
        }
        if ((each.label === 1) && (predVal === 1)) {
            truePositive++
        }
        if ((each.label === 0) && (predVal === 0)) {
            trueNegative++
        }

        if ((each.label === 0) && (predVal === 1)) {
            falsePositive++
        }

        if ((each.label === 1) && (predVal === 0)) {
            falseNegative++
        }
    });

    let metricRow = {
        acc: (truePositive + trueNegative) / data.length,
        threshold: threshold,
        tp: truePositive,
        tn: trueNegative,
        fp: falsePositive,
        fn: falseNegative,
        tpr: truePositive / (truePositive + falseNegative),
        fpr: falsePositive / (trueNegative + falsePositive),
        fnr: falseNegative / (truePositive + falseNegative),
        tnr: trueNegative / (trueNegative + falsePositive),

    }
    let accuracy = ((ac / data.length) * 100).toFixed(2)
    return metricRow

}



export function abbreviateString(value, maxLength) {
    if (value.length <= maxLength) {
        return value
    } else {
        let retval = value.substring(0, maxLength) + " .."
        return retval
    }
}

export function boundWidth(widthVal) {
    if (widthVal < 0) {
        return 0;
    } else if (widthVal > 1) {
        return 1;
    } else {
        return widthVal;
    }
}

function intlFormat(num) {
    return new Intl.NumberFormat().format(Math.round(num * 10) / 10);
}
export function makeFriendly(num) {
    if (num < 1 && num > 0) {
        return num
    }
    if (Math.abs(num) >= 1000000)
        return intlFormat(num / 1000000) + 'M';
    if (Math.abs(num) >= 1000)
        return intlFormat(num / 1000) + 'k';
    return intlFormat(num);
}

export function loadJSONData(url) {
    return fetch(url)
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }
                // Examine the text in the response
                //    response.text().then(function(data){
                //        console.log(data)
                //    })
                return response.json().then(function (data) {
                    return data
                });
            }
        )
        .catch(function (err) {
            console.log('Fetch Error :-S', err);
        });
}

export function ColorArray() {
    let colorArray = [
        "#1f78b4",
        "#b2df8a",
        "#33a02c",
        "#fb9a99",
        "#e31a1c",
        "#fdbf6f",
        "#ff7f00",
        "#6a3d9a",
        "#cab2d6",
        "#ffff99",
        "#8fff4f"
    ]
    return colorArray
}


export function ColorArrayRGB() {
    let colorArray = [
        [141, 211, 199],
        [255, 255, 179],
        [190, 186, 218],
        [251, 128, 114],
        [128, 177, 211],
        [253, 180, 98],
        [179, 222, 105],
        [252, 205, 229],
        [188, 128, 189],
        [204, 235, 197],
    ]
    return colorArray
}

export function checkInView(container, element, partial, containerOffset, elementOffset) {

    if (container) {
        //Get container properties
        let cTop = container.scrollTop;
        let cBottom = cTop + container.clientHeight + containerOffset;

        //Get element properties
        let eTop = element.offsetTop + elementOffset;
        let eBottom = eTop + element.clientHeight;

        //Check if in view    
        let isTotal = (eTop >= cTop && eBottom <= cBottom);
        let isPartial = partial && (
            (eTop < cTop && eBottom > cTop) ||
            (eBottom > cBottom && eTop < cBottom)
        );

        //Return outcome
        // console.log("cT:", cTop, "conHei", container.clientHeight, " offset", containerOffset, elementOffset, container.offsetTop)
        // console.log(element.offsetTop, "eT:", eTop, "cT:", cTop, "eB:", eBottom, "cB:", cBottom, isTotal || isPartial)
        return (isTotal || isPartial);
    } else {
        return false
    }


}

export const LeaderLine = window.LeaderLine;
export const animOptions = { duration: 800, timing: 'ease' }
export const greyColor = "rgba(189, 195, 199, 0.5)"
export const blueColor = 'rgba(0,98,255, 1)'
