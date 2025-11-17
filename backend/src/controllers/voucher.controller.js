import voucherService from "../services/voucher.service.js";

class VoucherController {
    
    // GET /api/vouchers
    async getAvailable(req, res) {
        try {
            const vouchers = await voucherService.getAvailableVouchers();
            res.json({ success: true, vouchers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // POST /api/vouchers/validate
    async validate(req, res) {
        try {
            const { code, orderTotal } = req.body;

            const result = await voucherService.validateVoucher(code, orderTotal);

            if (!result.valid) {
                return res.status(400).json({ success: false, message: result.message });
            }

            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // POST /api/vouchers/use
    async use(req, res) {
        try {
            const { code } = req.body;

            const voucher = await voucherService.useVoucher(code);

            if (!voucher) {
                return res.status(400).json({ success: false, message: "Voucher không tồn tại." });
            }

            res.json({ success: true, voucher });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new VoucherController();
