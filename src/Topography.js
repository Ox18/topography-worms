const getPixels = require("get-pixels");
const fs = require("fs");
const { loadImage, createCanvas } = require("canvas");

const consts = require("./consts")

class Topography {
    data = [];
    width = 0;
    height = 0;
    points = [];
    terrainImage = null;

    constructor(terrainImage) {
        this.terrainImage = terrainImage;
    }

    async initialize() {
        try {
            const { width, height, data } = await this.getData(this.terrainImage);
            this.width = width;
            this.height = height;
            this.data = data;
            this.generatePoints();
        } catch (exception) {
            console.error("the map image with path " + this.terrainImage + " could not be loaded");
            console.error("The error was: " + exception);
        }
    }

    async draw() {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext("2d");

        const img = await loadImage(this.terrainImage);
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        const data2 = imageData.data;

        for (let i = 0; i < this.points.length; i += 4) {
            const point = this.points[i];
            const r = 255;
            const g = 0;
            const b = 0;
            const a = 255;

            data2[4 * (point.y * this.width + point.x) + 0] = r;
            data2[4 * (point.y * this.width + point.x) + 1] = g;
            data2[4 * (point.y * this.width + point.x) + 2] = b;
            data2[4 * (point.y * this.width + point.x) + 3] = a;
        }

        ctx.putImageData(imageData, 0, 0);

        const img2 = canvas.toDataURL();
        const base64Data = img2.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync("./abc.png"
        , base64Data, "base64");
    }

    generatePoints() {
        for (let xPos = 0; xPos < this.width; xPos++) {
            for (let yPos = 0; yPos < this.height; yPos++) {
                const { x, y, stuck, fall_and_die } = this.nextPositionForWalking(xPos, yPos, consts.DIRECTION.RIGHT);
                // if not stuckd or fall and die
                if (!stuck && !fall_and_die) {

                    if(!this.positionIsNotOusideBox(x, y)) {
                        this.points.push({ x, y });
                    }
                }
            }
        }
    }

    async getData(path) {
        return new Promise((resolve, reject) => {
            getPixels(path, function (error, pixels) {
                if (error) {
                    reject(error);
                } else {
                    const { shape, data } = pixels;
                    const [w, h] = shape;

                    resolve({
                        width: w,
                        height: h,
                        data
                    })
                }
            })
        })
    }

    nextPositionForWalking(x, y, direction) {
        const nextPositionX = direction === consts.DIRECTION.LEFT ? x - 1 : x + 1;

        if (0 > nextPositionX || nextPositionX >= this.width) {
            return {
                x,
                y,
                stuck: !0
            }
        }

        if (this.isPixel(nextPositionX, y)) {
            for (direction = y; direction > y - 30; direction--) {
                if (!this.isPixel(nextPositionX, direction)) {
                    return {
                        x: nextPositionX,
                        y: direction
                    }
                }
            }
            return {
                x,
                y,
                stuck: !0
            }
        }

        for (direction = y + 1; direction < this.height; direction++) {
            if (this.isPixel(nextPositionX, direction)) {
                return {
                    x: nextPositionX,
                    y: direction - 1
                }
            }
        }

        return {
            x: nextPositionX,
            y: this.height + 100,
            fall_and_die: !0
        }
    }

    positionIsNotOusideBox(x, y) {

        const pointFinal = y - 1;
        const pointBase = y - 40;



        for (let i = pointBase; i < pointFinal; i++) {
            if (this.isPixel(x, i) || this.isPixel(x + 1, i) || this.isPixel(x - 1, i) || this.isPixel(x + 2, i) || this.isPixel(x - 2, i)) {
                return true;
            }
        }
        return false;
    }

    isPixel(x, y) {
        return !(0 > x || x >= this.width || 0 > y || y >= this.height) && 0 < this.data[4 * (y * this.width + x) + 3]
    }
}

module.exports = {
    Topography
}