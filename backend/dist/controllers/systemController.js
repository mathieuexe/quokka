import { getMaintenanceSettings } from "../repositories/systemRepository.js";
export async function getPublicMaintenanceSettings(_req, res) {
    const settings = await getMaintenanceSettings();
    res.json({ maintenance: settings });
}
