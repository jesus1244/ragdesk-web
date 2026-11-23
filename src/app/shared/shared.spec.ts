import { HttpErrorResponse } from '@angular/common/http';

import { errorMessage } from '../core/http/api-error';
import { FileSizePipe } from './file-size-pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();
  it('formats bytes', () => {
    expect(pipe.transform(512)).toBe('512 B');
    expect(pipe.transform(1536)).toBe('1.5 KB');
    expect(pipe.transform(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(pipe.transform(null)).toBe('');
  });
});

describe('errorMessage', () => {
  it('uses the API message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { code: 'conflict', message: 'Email is already registered' },
    });
    expect(errorMessage(error)).toBe('Email is already registered');
  });

  it('summarizes validation errors', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        code: 'validation_error',
        message: 'x',
        details: [{ loc: ['body', 'url'], msg: 'Invalid URL' }],
      },
    });
    expect(errorMessage(error)).toBe('url: Invalid URL');
  });

  it('explains network failures', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
  });
});
