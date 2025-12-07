const bannerController = require('../src/controllers/bannerController');
const supabase = require('../src/config/supabase');
const fs = require('fs');

// Mock request and response objects
const mockReq = (body = {}, params = {}) => ({
    body,
    params
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

// Logging helper
function log(msg) {
    console.log(msg);
    fs.appendFileSync('run_log.txt', msg + '\n');
}

const next = (err) => {
    log("DEBUG: Next function called");
    if (err) {
        log("DEBUG: Error caught!");
        log("DEBUG MESSAGE: " + err.message);
        log("DEBUG DETAILS: " + JSON.stringify(err, null, 2));
    }
};

async function testBanners() {
    // Clear log file
    fs.writeFileSync('run_log.txt', 'Starting Test\n');
    log("Starting Banner API Tests...");

    // Test 1: Add Banner
    log("\nTesting Add Banner...");
    const addReq = mockReq({ title: "Test Banner", sub_text: "Limited Time Offer", image: "http://example.com/banner.jpg" });
    const addRes = mockRes();

    log("Calling addBanner...");
    try {
        await bannerController.addBanner(addReq, addRes, next);
    } catch (e) {
        log("Caught unexpected exception in addBanner: " + e.message);
    }

    if (addRes.statusCode === 201) {
        log("Add Banner: SUCCESS " + JSON.stringify(addRes.data));
    } else {
        log("Add Banner: FAILED StatusCode=" + addRes.statusCode);
    }

    let bannerId;
    if (addRes.data && addRes.data.banner) {
        bannerId = addRes.data.banner.id;
    }

    if (!bannerId) {
        log("Skipping further tests as banner creation failed.");
        return;
    }

    // Test 2: Get All Banners
    log("\nTesting Get All Banners...");
    const getReq = mockReq();
    const getRes = mockRes();
    await bannerController.getAllBanners(getReq, getRes, next);

    if (getRes.statusCode === 200) {
        log("Get All Banners: SUCCESS Count=" + getRes.data.count);
    } else {
        log("Get All Banners: FAILED StatusCode=" + getRes.statusCode);
    }

    // Test 3: Edit Banner
    log("\nTesting Edit Banner...");
    const editReq = mockReq({ title: "Updated Banner Title" }, { id: bannerId });
    const editRes = mockRes();
    await bannerController.editBanner(editReq, editRes, next);

    if (editRes.statusCode === 200) {
        log("Edit Banner: SUCCESS " + JSON.stringify(editRes.data));
    } else {
        log("Edit Banner: FAILED StatusCode=" + editRes.statusCode);
    }

    // Test 4: Delete Banner
    log("\nTesting Delete Banner...");
    const delReq = mockReq({}, { id: bannerId });
    const delRes = mockRes();
    await bannerController.deleteBanner(delReq, delRes, next);

    if (delRes.statusCode === 200) {
        log("Delete Banner: SUCCESS " + JSON.stringify(delRes.data));
    } else {
        log("Delete Banner: FAILED StatusCode=" + delRes.statusCode);
    }
}

testBanners().catch(err => {
    console.error(err);
    fs.appendFileSync('run_log.txt', 'Top level error: ' + err.message + '\n');
});
