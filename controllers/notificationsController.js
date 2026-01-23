const salesforceLogin = require('../config/salesforce');

exports.saveToken = async (req, res) => {
  try {
    const { token } = req.body;           // 👈 MUST be "token"
    const { contactId } = req.user;       // 👈 from JWT

    if (!token) {
      return res.status(400).json({ message: 'Token missing' });
    }

    const conn = await salesforceLogin();

    await conn.sobject('Contact').update({
      Id: contactId,
      FCM_Token__c: token,
    });

    console.log('✅ TOKEN SAVED TO CONTACT =>', contactId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save token' });
  }
};
// Get teachers by class
exports.getTeachersByClass = async (req, res) => {
  try {
    const { className } = req.query;

    if (!className) {
      return res.status(400).json({ message: 'className is required' });
    }

    // Salesforce query
    const query = `
      SELECT teacherId__r.Id, teacherId__r.Name
      FROM Teacher_Assignment__c
      WHERE Class_Name__c = '${className}'
    `;

    const result = await req.salesforce.query(query);

    // Remove duplicates
    const teachersMap = {};
    result.records.forEach(r => {
      if (r.teacherId__r) {
        teachersMap[r.teacherId__r.Id] = {
          id: r.teacherId__r.Id,
          name: r.teacherId__r.Name
        };
      }
    });

    res.json(Object.values(teachersMap));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
};
