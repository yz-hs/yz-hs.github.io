
class Transition {
    constructor(from, to, duration, delay = 0, timing = null) {
        this.startTime = Date.now() + delay;
        this.endTime = this.startTime + duration;
        this.from = from;
        this.to = to;
        this.ended = false;
        this.value = from;
        this.timing = Transition.getTimingFunction(timing);
    }
    update() {
        var now = Date.now();
        if (now <= this.startTime) {
            this.value = this.from;
            return false;
        }
        if (now >= this.endTime) {
            this.value = this.to;
            this.ended = true;
            return true;
        }
        var lambda = (now - this.startTime) / (this.endTime - this.startTime);
        this.value = this.timing(this.from, this.to, lambda);
        return false;
    }
    static defineTimingFunction(timing, fn) {
        this.timingFunctions[timing] = fn;
    }
    static getTimingFunction(timing) {
        if (typeof timing === 'function') return timing;
        if (typeof timing === 'string') {
            if (timing in this.timingFunctions) {
                return this.timingFunctions[timing];
            }
        }
        return this.timingFunctions[this.defaultTiming];
    }
    static staticValue(value) {
        return new Transition(value, value, -1, 1, () => value);
    }
}

Transition.timingFunctions = {};
Transition.defineTimingFunction('linear', (x, y, lambda) => x + lambda * (y - x));
Transition.defaultTiming = 'linear';
