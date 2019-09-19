import AnyType from './AnyType';

export default class DateType extends AnyType {

    protected _formatDate(): (d: Date) => string;

    protected _formatDateItems(): (m: number[]) => string;

    protected _dateItemsToISO(m: number[]): string;

    protected _matchDatePattern(): (v: string) => number[];
}

export declare function isValidDate(d: Date | void): boolean;
