import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('waitUntil', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('Should throw an error if an invalid condition is used', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            // @ts-ignore test invalid condition parameter
            val = await browser.waitUntil('foo', {
                timeout: 500,
                timeoutMsg: 'Timed Out',
                interval: 200
            })
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Condition is not a function')
            expect(val).toBeUndefined()
        }
    })

    it.each([false, '', 0])('Should throw an error when the waitUntil times out e.g. doesnt resolve to a truthy value: %i', async () => {
        let error
        let val
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve) => setTimeout(
                        () => resolve(false),
                        200
                    )
                ), {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Timed Out')
            expect(val).toBeUndefined()
        }
    })

    it('Should throw an error when the promise is rejected', async () => {
        let error
        let val
        expect.assertions(3)
        try {
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (_, reject) => setTimeout(
                        () => reject(new Error('foobar')),
                        200
                    )
                ), {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('waitUntil condition failed with the following reason: foobar')
            expect(error.stack).toContain(`browser${path.sep}waitUntil.test.ts:73`)
            expect(val).toBeUndefined()
        }
    })

    it('should throw an error if the condition throws', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(3)
        try {
            val = await browser.waitUntil(
                () => {
                    throw new Error('foobar')
                }, {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('waitUntil condition failed with the following reason: foobar')
            expect(error.stack).toContain(`browser${path.sep}waitUntil.test.ts:99`)
            expect(val).toBeUndefined()
        }
    })

    it('Should throw an error when the promise is rejected without error message', async () => {
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve, reject) => setTimeout(
                        () => reject(new Error()),
                        200
                    )
                ), {
                    timeout: 500
                }
            )
        } catch (err: any) {
            expect(err.message).toContain('waitUntil condition failed with the following reason: Error')
            expect(val).toBeUndefined()
        }
    })

    it('Should use default timeout setting from config if passed in value is not a number', {
        timeout: 10_000
    }, async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            // @ts-ignore test invalid timeout parameter
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve) => setTimeout(
                        () => resolve(false),
                        500
                    )
                ), {
                    // @ts-expect-error wrong parameter
                    timeout: 'blah',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toMatch(/waitUntil condition timed out after \d+ms/)
            expect(val).toBeUndefined()
        }
    })

    it('Should use default interval setting from config if passed in value is not a number', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            // @ts-ignore test invalid interval parameter
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve) => setTimeout(
                        () => resolve(false),
                        500
                    )
                ), {
                    timeout: 1000,
                    timeoutMsg: 'Timed Out',
                    // @ts-expect-error wrong parameter
                    interval: 'blah'
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Timed Out')
            expect(val).toBeUndefined()
        }
    })

    it.each([true, 'false', 123])('Should pass for a truthy resolved value: %i', async(n) => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<any>(
                    (resolve) => setTimeout(
                        () => resolve(n),
                        200
                    )
                ), {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error).toBeUndefined()
            expect(val).toBe(n)
        }
    })

    it.each([false, '', 0])('Should throw a custom error message when the waitUntil always returns false: %i', async (n) => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(() => n, {
                timeout: 500,
                timeoutMsg: 'Custom error message',
                interval: 200
            })
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Custom error message')
            expect(val).toBeUndefined()
        }
    })

    it.each([false, '', 0])('if no timeousMsg is given, Should throw a default error message when the waitUntil always returns false: %i', async (n) => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(() => n, {
                timeout: 500,
                interval: 200
            })
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toMatch(/waitUntil condition timed out after \d+ms/)
            expect(val).toBeUndefined()
        }
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
