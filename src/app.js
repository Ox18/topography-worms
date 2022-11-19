(async () => {
    const path = require("path");
    const { Topography } = require("./Topography")
    
    const mapPath = path.join(__dirname + "/resources/map.png");
    const topography = new Topography(mapPath);
    await topography.initialize();
    await topography.draw();
    console.log(topography.data)
})()    