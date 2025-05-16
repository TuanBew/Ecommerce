const { promisify } = require('util');

// Import models
const index = require('../../models/customer/index.model');
const account = require('../../models/customer/account.model');
const general = require('../../models/general.model');

const accountController = () => { };

// [GET] /account/information
accountController.information = async (req, res) => {
    try {
        let header_user = await index.header_user(req);
        let header = await index.header(req);
        let formatFunction = await general.formatFunction();

        res.status(200).render('./pages/account/information', {
            header: header,
            user: header_user,
            formatFunction: formatFunction
        });
    } catch (error) {
        console.error("Error in account information:", error);
        res.status(500).redirect('/error');
    }
}

// [POST] /account/information
accountController.updateInformation = async (req, res) => {
    try {
        // Implementation for updating user information
        res.redirect('/account/information');
    } catch (error) {
        console.error("Error updating account information:", error);
        res.status(500).redirect('/error');
    }
}

// [GET] /account/purchase
accountController.purchase = async (req, res) => {
    try {
        let header_user = await index.header_user(req);
        let header = await index.header(req);
        let formatFunction = await general.formatFunction();
        
        // Use customer_id for order lookup
        let orders = await account.getOrders(req.user.customer_id);

        res.status(200).render('./pages/account/purchase', {
            header: header,
            user: header_user,
            orders: orders,
            formatFunction: formatFunction
        });
    } catch (error) {
        console.error("Error in purchase history:", error);
        res.status(500).redirect('/error');
    }
}

// [GET] /account/purchase/:id
accountController.purchaseDetail = async (req, res) => {
    try {
        let header_user = await index.header_user(req);
        let header = await index.header(req);
        let formatFunction = await general.formatFunction();
        
        // Get specific order details
        let orderId = req.params.id;
        let orderDetails = await account.getOrderDetails(orderId, req.user.user_id);
        
        if (!orderDetails) {
            return res.redirect('/account/purchase');
        }

        res.status(200).render('./pages/account/purchase-detail', {
            header: header,
            user: header_user,
            order: orderDetails,
            formatFunction: formatFunction
        });
    } catch (error) {
        console.error("Error in purchase detail:", error);
        res.status(500).redirect('/error');
    }
}

// Additional controller methods
accountController.address = async (req, res) => {
    // Implementation
    res.redirect('/account/information');
}

accountController.updateAddress = async (req, res) => {
    // Implementation
    res.redirect('/account/information');
}

accountController.password = async (req, res) => {
    // Implementation
    res.redirect('/account/information');
}

accountController.updatePassword = async (req, res) => {
    // Implementation
    res.redirect('/account/information');
}

module.exports = accountController;