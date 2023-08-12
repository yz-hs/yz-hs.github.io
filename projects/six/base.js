
let util = {
    randInt(a, b) {
        if (typeof b === 'undefined') {
            return Math.floor(Math.random() * Math.floor(a));
        } else {
            a = Math.ceil(a);
            b = Math.floor(b);
            return Math.floor(Math.random() * (b - a + 1)) + a;
        }
    },
    makeArray(size, val) {
        let res = [];
        let size1 = size.slice(1);
        for (var i = 0; i < size[0]; ++i) {
            res.push(size.length === 1 ? val : util.makeArray(size1, val));
        }
        return res;
    },
    isMobileDevice() {
        var str = navigator.userAgent.toLowerCase();
        var arr = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"]
        for (let i = 0; i < arr.length; ++i) {
            if (str.includes(arr[i].toLowerCase())) return true;
        }
        return false;
    }
};
