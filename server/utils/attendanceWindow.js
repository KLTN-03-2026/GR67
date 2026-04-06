const moment = require('moment');

const CHECK_IN_BEFORE_MIN = 60;
const CHECK_IN_AFTER_MIN = 10;

/**
 * Khung điểm danh: [giobatdau - 60 phút, giobatdau + 10 phút]
 */
function isWithinCheckInWindow(now, giobatdau) {
  const mNow = moment(now);
  const start = moment(giobatdau).subtract(CHECK_IN_BEFORE_MIN, 'minutes');
  const end = moment(giobatdau).add(CHECK_IN_AFTER_MIN, 'minutes');
  return mNow.isSameOrAfter(start) && mNow.isSameOrBefore(end);
}

function windowStatus(now, giobatdau) {
  const mNow = moment(now);
  const start = moment(giobatdau).subtract(CHECK_IN_BEFORE_MIN, 'minutes');
  const end = moment(giobatdau).add(CHECK_IN_AFTER_MIN, 'minutes');
  if (mNow.isBefore(start)) return 'too_early';
  if (mNow.isAfter(end)) return 'too_late';
  return 'eligible';
}

/**
 * Chọn buổi trong danh sách đang trong khung và gần `now` nhất (theo |now - giobatdau|).
 */
function pickBestEligibleSession(eligibleRows, now) {
  if (!eligibleRows.length) return null;
  const mNow = moment(now);
  return eligibleRows.reduce((best, cur) => {
    const diffBest = Math.abs(mNow.diff(moment(best.buoi.giobatdau)));
    const diffCur = Math.abs(mNow.diff(moment(cur.buoi.giobatdau)));
    return diffCur < diffBest ? cur : best;
  });
}

module.exports = {
  isWithinCheckInWindow,
  windowStatus,
  pickBestEligibleSession,
  CHECK_IN_BEFORE_MIN,
  CHECK_IN_AFTER_MIN,
};
