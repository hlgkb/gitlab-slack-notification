const forEach = (array, callback) => {
  for (let index = 0;index < array.length;index++) {
    const element = array[index];
    callback(element, index, array)
  }
}

const humanFormatDate = (dateString) => {
  let strDate = ''
  let parsedDate = new Date(dateString)
  let currentDate = new Date()

  let diffInYears = currentDate.getFullYear() - parsedDate.getFullYear()
  let diffInMonths = currentDate.getMonth() - parsedDate.getMonth()
  let diffInDays = currentDate.getDay() - parsedDate.getDay()

  let parsedHour = parsedDate.getHours()
  let parsedMinute = parsedDate.getMinutes()

  if (diffInYears === 0) {
    if (diffInMonths === 0) {
      if (diffInDays === 0) {
        strDate += 'Today'
      } else if (diffInDays === 1) {
        strDate += 'Yesterday'
      } else {
        strDate += `${diffInDays} Days ago`
      }
    } else {
      strDate += `${parsedDate.getDate()}`
    }
  } else {
    strDate += `${parsedDate.getDate()}`
  }

  strDate += `@${parsedHour}:${parsedMinute} ${(parsedHour < 12) ? 'AM' : 'PM'}`
  return strDate
}

module.exports = {
  forEach: forEach,
  humanFormatDate: humanFormatDate
}