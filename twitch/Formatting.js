class Formatting {
    /**
     * @param {Number} day - 0-6 as a representation of the day of the week (0 = Sunday)
     * @returns {String} The corresponding day of the week as a 3 character String
    */
    parseDay(day) {
        let result = "";

        switch (day) {
            case 0:
                result = "Sun";
                break;
            case 1:
                result = "Mon";
                break;
            case 2:
                result = "Tue";
                break;
            case 3:
                result = "Wed";
                break;
            case 4:
                result = "Thu";
                break;
            case 5:
                result = "Fri";
                break;
            case 6:
                result = "Sat";
        }

        return result;
    }

    /**
     * 
     * @param { Number | String | Date | undefined } timestamp - The timestamp to parse, if provided, otherwise the current time is parsed
     * @returns {String} The parsed Date in the format MM:DD:YY HH:MM:SS
     */
    parseDate(timestamp) {
        let dte = new Date(timestamp);

        let hr = "" + dte.getHours();
        let mn = "" + dte.getMinutes();
        let sc = "" + dte.getSeconds();

        if (hr.length === 1) hr = "0" + hr;
        if (mn.length === 1) mn = "0" + mn;
        if (sc.length === 1) sc = "0" + sc;

        let mo = "" + (dte.getMonth() + 1);
        let dy = "" + dte.getDate();
        let yr = dte.getFullYear();

        if (mo.length === 1) mo = "0" + mo;
        if (dy.length === 1) dy = "0" + dy;

        return `${this.parseDay(dte.getDay())} ${mo}.${dy}.${yr} ${hr}:${mn}:${sc}`;
    }
}

module.exports = Formatting;