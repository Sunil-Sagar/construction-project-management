const db = require('../config/database');

/**
 * Calculate wages for a worker for a specific week (Sunday to Saturday)
 * Handles variable rates - applies correct rate based on effective date
 */
const calculateWeeklyWage = (workerId, weekStartDate, weekEndDate, callback) => {
  // Get all attendance for the week
  const attendanceQuery = `
    SELECT date, attendance_value, ot_hours
    FROM attendance
    WHERE worker_id = ? AND date BETWEEN ? AND ?
    ORDER BY date
  `;

  db.all(attendanceQuery, [workerId, weekStartDate, weekEndDate], (err, attendanceRecords) => {
    if (err) {
      return callback(err);
    }

    // Get rate history for this worker
    const rateQuery = `
      SELECT daily_rate, ot_rate, effective_date
      FROM worker_rate_history
      WHERE worker_id = ? AND effective_date <= ?
      ORDER BY effective_date DESC
    `;

    db.all(rateQuery, [workerId, weekEndDate], (err, rateHistory) => {
      if (err) {
        return callback(err);
      }

      if (rateHistory.length === 0) {
        // No rate history, get current rate from worker
        db.get(
          'SELECT current_rate as daily_rate, ot_rate FROM workers WHERE id = ?',
          [workerId],
          (err, workerRate) => {
            if (err) return callback(err);
            if (!workerRate || workerRate.daily_rate == null) {
              return callback(new Error('Worker has no rate configured'));
            }
            rateHistory = [{ 
              daily_rate: parseFloat(workerRate.daily_rate) || 0, 
              ot_rate: parseFloat(workerRate.ot_rate) || 100, 
              effective_date: weekStartDate 
            }];
            calculateWages();
          }
        );
      } else {
        calculateWages();
      }

      function calculateWages() {
        let totalDays = 0;
        let totalOtHours = 0;
        let grossWage = 0;

        // For each attendance record, find the applicable rate
        attendanceRecords.forEach(record => {
          const recordDate = record.date;
          
          // Find the rate applicable on this date (most recent rate before or on this date)
          let applicableRate = rateHistory[0]; // Default to most recent
          for (let i = 0; i < rateHistory.length; i++) {
            if (rateHistory[i].effective_date <= recordDate) {
              applicableRate = rateHistory[i];
              break;
            }
          }

          // Ensure rates are valid numbers
          const dailyRate = parseFloat(applicableRate.daily_rate) || 0;
          const otRate = parseFloat(applicableRate.ot_rate) || 100;
          const attendanceValue = parseFloat(record.attendance_value) || 0;
          const otHours = parseFloat(record.ot_hours) || 0;

          // Calculate wage for this day
          const dailyWage = attendanceValue * dailyRate;
          const otWage = otHours * otRate;
          
          totalDays += attendanceValue;
          totalOtHours += otHours;
          grossWage += dailyWage + otWage;
        });

        // Get total advances for the week
        const advancesQuery = `
          SELECT COALESCE(SUM(amount), 0) as total_advances
          FROM advances
          WHERE worker_id = ? AND date BETWEEN ? AND ?
        `;

        db.get(advancesQuery, [workerId, weekStartDate, weekEndDate], (err, advanceResult) => {
          if (err) {
            return callback(err);
          }

          const totalAdvances = advanceResult.total_advances || 0;
          const netPayable = grossWage - totalAdvances;

          // Get rates for storing in payout record
          const avgDailyRate = rateHistory[0] ? parseFloat(rateHistory[0].daily_rate) || 0 : 0;
          const avgOtRate = rateHistory[0] ? parseFloat(rateHistory[0].ot_rate) || 100 : 100;

          callback(null, {
            days_worked: parseFloat(totalDays.toFixed(2)),
            ot_hours: parseFloat(totalOtHours.toFixed(2)),
            gross_wage: parseFloat(grossWage.toFixed(2)),
            advances: parseFloat(totalAdvances.toFixed(2)),
            net_payable: parseFloat(netPayable.toFixed(2)),
            daily_rate: parseFloat(avgDailyRate.toFixed(2)),
            ot_rate: parseFloat(avgOtRate.toFixed(2))
          });
        });
      }
    });
  });
};

/**
 * Get the start and end dates for a week given any date (Sunday to Saturday)
 */
const getWeekBoundaries = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate Sunday of the week
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  
  // Calculate Saturday of the week
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  
  return {
    startDate: sunday.toISOString().split('T')[0],
    endDate: saturday.toISOString().split('T')[0]
  };
};

/**
 * Calculate wages for all active workers for a given week
 */
const calculateWeeklyWagesForAllWorkers = (weekStartDate, weekEndDate, callback) => {
  // Get all active workers who have attendance in this week
  const query = `
    SELECT DISTINCT w.id, w.name, w.role
    FROM workers w
    JOIN attendance a ON w.id = a.worker_id
    WHERE a.date BETWEEN ? AND ?
    ORDER BY w.name
  `;

  db.all(query, [weekStartDate, weekEndDate], (err, workers) => {
    if (err) {
      return callback(err);
    }

    if (workers.length === 0) {
      return callback(null, []);
    }

    let results = [];
    let completed = 0;

    workers.forEach(worker => {
      calculateWeeklyWage(worker.id, weekStartDate, weekEndDate, (err, wageData) => {
        if (err) {
          console.error(`Error calculating wage for worker ${worker.id}:`, err);
        } else {
          results.push({
            worker_id: worker.id,
            worker_name: worker.name,
            worker_role: worker.role,
            ...wageData
          });
        }

        completed++;
        if (completed === workers.length) {
          callback(null, results);
        }
      });
    });
  });
};

module.exports = {
  calculateWeeklyWage,
  getWeekBoundaries,
  calculateWeeklyWagesForAllWorkers
};
