const express = require('express');
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { companySchema, updateCompanySchema } = require('../validators/company.validator');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(companySchema), companyController.createCompany);
router.get('/', companyController.listCompanies);
router.put('/:id', validate(updateCompanySchema), companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;
