export interface VueTableOptions {
  /** Enable multiple columns sorting using Shift + Click on the client component */
  clientMultiSorting?: boolean;

  /**
   * Add class(es) to the specified columns.
   * Takes key-value pairs, where the key is the column name and the value
   *  is a string of space-separated classes
   */
  columnsClasses?: {
    [columnName: string]: string;
  };

  columnsDropdown?: boolean;

  /**
   * Responsive display for the specified columns.
   *
   * Columns will only be shown when the window width is within the defined limits.
   *
   * Accepts key-value pairs of column name and device.
   *
   * Possible values are mobile (x < 480), mobileP (x < 320), mobileL (320 <= x < 480),
   * tablet (480 <= x < 1024), tabletP (480 <= x < 768), tabletL (768 <= x < 1024),
   * desktop (x >= 1024).
   *
   * All options can be preceded by the logical operators min,max, and not followed by an
   * underscore.
   *
   * For example, a column which is set to not_mobile will be shown when the width of the
   * window is greater than or equal to 480px, while a column set to max_tabletP will only
   * be shown when the width is under 768px
   */
  columnsDisplay?: {
    [columnName: string]: string;
  };

  /**
   * Use daterangepicker as a filter for the specified columns (when `filterByColumn` is set
   * to true).
   *
   * Dates should be passed as moment objects, or as strings in conjunction with the
   * `toMomentFormat` option.
   */
  dateColumns?: string[];

  /**
   * Format to display date objects (client component). Using momentjs. This will also affect
   * the datepicker on both components
   */
  dateFormat?: string;

  /** Override the default date format for specific columns */
  dateFormatPerColumn?: {
    [columnName: string]: string;
  };

  /** Options for the daterangepicker when using a date filter (see `dateColumns`) */
  datepickerOptions?: {
    [columnName: string]: string;
  };

  /**
   * Additional options for specific columns, to be merged with datepickerOptions.
   * Expects an object where the key is a column name, and the value is an options object.
   */
  datepickerPerColumnOptions?: {
    [columnName: string]: any;
  };

  /** Add column filters */
  filterByColumn?: boolean;

  /** Array of column names to allow filtering on. Defaults to all. */
  filterable?: string[] | false;

  /**
   * Group rows by a common property. E.g, for a list of countries,
   * group by the continent property
   */
  groupBy?: string;

  /**
   * Meta data associated with each group value. To be used in
   * conjunction with groupBy.
   */
  groupMeta?: string[];

  /** Table headings */
  headings?: {
    [columnName: string]: string;
  };

  headingsTooltips?: {
    [columnName: string]: string;
  };

  /**
   * An array of columns to hide initially (can then be added by user using
   * `columnsDropdown` option). Mutually exclusive with `visibleColumns`.
   */
  hiddenColumns?: string[] | boolean;

  highlightMatches?: boolean;

  /**
   * Set initial values for all filter types: generic, by column or custom.
   *
   * Accepts an object of key-value pairs, where the key is one of the following:
   *
   * a. "GENERIC" - for the generic filter
   * b. column name - for by column filters.
   * c. filter name - for custom filters.
   *
   * In case of date filters the date range should be passed as an object
   * comprised of start and end properties, each being a moment object.
   */
  initFilters?: {
    [columnName: string]: string;
  };

  initialPage?: number;

  /**
   * When filtering by column (option filterByColumn:true),
   * the listColumns option allows for filtering columns whose values
   * are part of a list, using a select box instead of the default
   * free-text filter.
   */
  listColumns?: {
    [columnName: string]: Array<{
      id: string;
      text: string;
      hide?: boolean;
    }>;
  };

  orderBy?: {
    /** Initial column to sort by */
    column: string;
    /** Initial order direction */
    ascending: boolean;
  };

  pagination?: {
    /** maximum pages in a chunk of pagination */
    chunk?: number;

    /** use a dropdown select pagination next to the records-per-page list, instead of links at the bottom of the table. */
    dropdown?: boolean;

    /** Show 'First' and 'Last' buttons */
    edge?: boolean;

    /** Which method to use when navigating outside of chunk boundries. Options are : scroll - the range of pages presented will incrementally change when navigating to a page outside the chunk (e.g 1-10 will become 2-11 once the user presses the next arrow to move to page 11). fixed - navigation will occur between fixed chunks (e.g 1-10, 11-20, 21-30 etc.). Double arrows will be added to allow navigation to the beginning of the previous or next chunk */
    nav?: 'scroll' | 'fixed';
  };

  /** Initial records per page	 */
  perPage?: number;

  /** Should columns be resizable? */
  resizableColumns?: boolean;

  /**
   * Add dynamic classes to table rows.
   *
   * `E.g function(row) { return row-${row.id}}`
   *
   * This can be useful for manipulating the appearance of rows based on the data they contain
   */
  rowClassCallback?: (row: any) => string | undefined;

  /** Enable render of child row toggler cell */
  showChildRowToggler?: boolean;

  /** Sortable columns */
  sortable?: string[];

  /** Text overrides */
  texts?: {
    columns: string;
    count: string;
    defaultOption: string;
    filter: string;
    filterBy: string;
    filterPlaceholder: string;
    first: string;
    last: string;
    limit: string;
    loading: string;
    noResults: string;
    page: string;
  };

  /**
   * When using the `groupBy` option, settings this to true will make group's visibility
   * togglable, by turning the group name into a button.
   */
  toggleGroups?: boolean;

  /**
   * The key of a unique identifier in your dataset, used to track the child rows,
   * and return the original row in row click event
   */
  uniqueKey?: string;

  /**
   * An array of columns to show initially (can then be altered by user using columnsDropdown
   * option). Mutually exclusive with `hiddenColumns`.
   */
  visibleColumns?: string[] | boolean;
}
