// Workaround for superagent tests
// github.com/DefinitelyTyped/DefinitelyTyped/issues/12044

// error TS2304: Cannot find name 'XMLHttpRequest'
declare interface XMLHttpRequest {}
// error TS2304: Cannot find name 'Blob'
declare interface Blob {}
