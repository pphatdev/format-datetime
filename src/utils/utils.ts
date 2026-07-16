import { Constants } from '../config/constants.ts';
import { Calculator } from '../lunar/calculator.ts';
import { KhmerDate } from '../lunar/khmer-date.ts';

/**
 * Represents information about a specific day in the Khmer lunar calendar.
 */
export interface KhmerLunarDayInfo {
    day: number;
    count: number;
    moonStatus: number;
    formatted: string;
}

/**
 * Represents an occurrence of a specific lunar day within a gregorian year.
 */
export interface LunarDayOccurrence {
    gregorian: string;
    khmer: string;
    month: number;
}

/**
 * Represents the difference between two Khmer dates.
 */
export interface KhmerDateDiff {
    days: number;
    years: number;
    months: number;
    gregorian_diff: number;
    is_past: boolean;
}

/**
 * Represents a Buddhist holiday.
 */
export interface BuddhistHoliday {
    name: string;
    name_en: string;
    date: string;
    khmer_date: string;
}

/**
 * Represents a traditional season in the Khmer calendar.
 */
export interface SeasonInfo {
    name: string;
    name_en: string;
}

/**
 * General utility methods for working with the Khmer calendar and dates.
 */
export class Utils {
    /**
     * Parses a Khmer date string into a KhmerDate instance.
     * Currently not fully implemented.
     * 
     * @param {string} _khmerDateString - The Khmer date string to parse.
     * @returns {KhmerDate | null} A new KhmerDate instance or null if parsing fails.
     */
    public static parseKhmerDate(_khmerDateString: string): KhmerDate | null {
        return null;
    }

    /**
     * Retrieves the range of days for a given Khmer month in a specific Buddhist Era (BE) year.
     * 
     * @param {number} khmerMonth - The index of the Khmer lunar month.
     * @param {number} beYear - The Buddhist Era year.
     * @returns {KhmerLunarDayInfo[]} An array containing information about each day in the month.
     */
    public static getKhmerMonthRange(khmerMonth: number, beYear: number): KhmerLunarDayInfo[] {
        const days = Calculator.getNumberOfDayInKhmerMonth(khmerMonth, beYear);
        const range: KhmerLunarDayInfo[] = [];

        for (let day = 0; day < days; day++) {
            const moonDay = Calculator.getKhmerLunarDay(day);
            range.push({
                day: day,
                count: moonDay.count,
                moonStatus: moonDay.moonStatus,
                formatted: moonDay.count.toString() + (moonDay.moonStatus === 0 ? 'កើត' : 'រោច')
            });
        }

        return range;
    }

    /**
     * Finds occurrences of a specific lunar day within a given gregorian year.
     * 
     * @param {number} dayCount - The lunar day count (1-15).
     * @param {number} moonStatus - The moon status (0 for waxing, 1 for waning).
     * @param {number} year - The Gregorian year to search within.
     * @returns {LunarDayOccurrence[]} An array of matching occurrences.
     */
    public static findLunarDayOccurrences(dayCount: number, moonStatus: number, year: number): LunarDayOccurrence[] {
        const occurrences: LunarDayOccurrence[] = [];
        const startDate = new Date(Date.UTC(year, 0, 1));
        const endDate = new Date(Date.UTC(year + 1, 0, 1));

        const current = new Date(startDate.getTime());
        while (current.getTime() < endDate.getTime()) {
            const khmerDate = new KhmerDate(current);
            const lunarInfo = KhmerDate.findLunarDate(current);
            const moonDay = Calculator.getKhmerLunarDay(lunarInfo.day);

            if (moonDay.count === dayCount && moonDay.moonStatus === moonStatus) {
                occurrences.push({
                    gregorian: current.toISOString().split('T')[0],
                    khmer: khmerDate.toLunarDate(),
                    month: lunarInfo.month
                });
            }

            current.setUTCDate(current.getUTCDate() + 1);
        }

        return occurrences;
    }

    /**
     * Calculates the difference between two KhmerDate instances.
     * 
     * @param {KhmerDate} date1 - The first date.
     * @param {KhmerDate} date2 - The second date.
     * @returns {KhmerDateDiff} An object representing the difference in days, months, and years.
     */
    public static diffInKhmer(date1: KhmerDate, date2: KhmerDate): KhmerDateDiff {
        const dt1 = date1.getDateTime();
        const dt2 = date2.getDateTime();

        const diffTime = Math.abs(dt2.getTime() - dt1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            days: diffDays,
            years: Math.floor(diffDays / 365),
            months: Math.floor(diffDays / 30),
            gregorian_diff: diffDays,
            is_past: dt1.getTime() < dt2.getTime()
        };
    }

    /**
     * Gets important Buddhist holidays for a given gregorian year.
     * 
     * @param {number} year - The Gregorian year.
     * @returns {Record<string, BuddhistHoliday>} A dictionary of holidays.
     */
    public static getBuddhistHolidays(year: number): Record<string, BuddhistHoliday> {
        const holidays: Record<string, BuddhistHoliday> = {};

        try {
            const visakhaBochea = Calculator.getVisakhaBochea(year);
            holidays['visakha_bochea'] = {
                name: 'ព្រះរាជពិធីវិសាខបូជា',
                name_en: 'Visakha Bochea',
                date: visakhaBochea.toISOString().split('T')[0],
                khmer_date: (new KhmerDate(visakhaBochea)).toLunarDate()
            };

            const khmerNewYear = KhmerDate.getKhNewYearMoment(year);
            holidays['khmer_new_year'] = {
                name: 'បុណ្យចូលឆ្នាំខ្មែរ',
                name_en: 'Khmer New Year',
                date: khmerNewYear.toISOString().split('T')[0],
                khmer_date: (new KhmerDate(khmerNewYear)).toLunarDate()
            };
        } catch (_e) {
            // Handle error silently as per PHP
        }

        return holidays;
    }

    /**
     * Converts a year between different eras (AD, BE, JS).
     * 
     * @param {number} year - The year to convert.
     * @param {string} fromEra - The original era ('AD', 'BE', 'JS').
     * @param {string} toEra - The target era ('AD', 'BE', 'JS').
     * @returns {number} The converted year.
     */
    public static convertEra(year: number, fromEra: string, toEra: string): number {
        let adYear = year;
        switch (fromEra.toUpperCase()) {
            case 'BE': adYear = year - 543; break;
            case 'JS': adYear = year + 1182; break;
            case 'AD': default: adYear = year; break;
        }

        switch (toEra.toUpperCase()) {
            case 'BE': return adYear + 543;
            case 'JS': return adYear - 1182;
            case 'AD': default: return adYear;
        }
    }

    /**
     * Checks if a given day, month, and year combination is a valid Khmer date.
     * 
     * @param {number} day - The lunar day index (0 to max days in month - 1).
     * @param {number} month - The lunar month index.
     * @param {number} beYear - The Buddhist Era year.
     * @returns {boolean} True if the date is valid, false otherwise.
     */
    public static isValidKhmerDate(day: number, month: number, beYear: number): boolean {
        if (month < 0 || month > 13) return false;

        if (
            (month === Constants.LUNAR_MONTHS['បឋមាសាឍ'] || month === Constants.LUNAR_MONTHS['ទុតិយាសាឍ'])
            && !Calculator.isKhmerLeapMonth(beYear)
        ) {
            return false;
        }

        const maxDays = Calculator.getNumberOfDayInKhmerMonth(month, beYear);
        if (day < 0 || day >= maxDays) return false;

        return true;
    }

    /**
     * Determines the traditional Khmer season for a given KhmerDate.
     * 
     * @param {KhmerDate} date - The KhmerDate instance to check.
     * @returns {SeasonInfo} An object containing the Khmer and English season names.
     */
    public static getSeason(date: KhmerDate): SeasonInfo {
        const month = date.khMonth();

        if ([Constants.LUNAR_MONTHS['មិគសិរ'], Constants.LUNAR_MONTHS['បុស្ស'], Constants.LUNAR_MONTHS['មាឃ']].includes(month)) {
            return { name: 'រដូវរងារ', name_en: 'Cold Season' };
        } else if ([Constants.LUNAR_MONTHS['ផល្គុន'], Constants.LUNAR_MONTHS['ចេត្រ'], Constants.LUNAR_MONTHS['ពិសាខ']].includes(month)) {
            return { name: 'រដូវក្ដៅ', name_en: 'Hot Season' };
        } else {
            return { name: 'រដូវវស្សា', name_en: 'Rainy Season' };
        }
    }
}
