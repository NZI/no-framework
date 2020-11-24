import { Express, RequestHandler } from 'express'
import { Server as WebSocketServer } from 'ws'

const services: {
    [key: string]: any
} = {}

const methods: {
    [key: string]: { [key: string]: boolean }
} = {}

export function Server(): RequestHandler {
    return async (request, response, next) => {
        const [, className, methodName] = request.path.split('/')
        try {
            if (className in services && methodName in methods[className]) {
                const data = await services[className][methodName]()
                return response.json(data)
            } else {
                return next()
            }
        } catch (e) {
            console.error(e)
            return next()
        }
    }
}

export function WServer(port: number) {
    const ws = new WebSocketServer({ port })

    console.log('Server listening on ' + port)

    ws.on('connection', client => {
        client.on('message', async (message) => {
            const packet = JSON.parse(message.toString())
            const {
                id,
                data: {
                    className,
                    methodName,
                    args
                } } = packet
            if (className in services && methodName in methods[className]) {
                const data = await services[className][methodName](...args)
                client.send(JSON.stringify({
                    id,
                    success: true,
                    data
                }))
            } else {
                client.send(JSON.stringify({
                    id,
                    success: false,
                    reason: "Method doesn't exist"
                }))
            }
        })
    })

    return services
}

interface ServiceResponse {
    id: number,
    data: any
}

export function Client(path: string): any {
    let instances = {}
    let client = new WebSocket(path)
    let id = 0

    let messages: { [key: string]: any } = {

    }

    let _ready = false

    let ready = new Promise((resolve, reject) => {
        client.addEventListener('open', () => {
            _ready = true
            resolve(true)

            client.addEventListener('message', message => {
                const {
                    id,
                    success,
                    reason,
                    data
                } = JSON.parse(message.data)
                if (success) {
                    messages[id].resolve(data)
                } else {
                    messages[id].reject(reason)
                }
            })

        })
    })

    console.log(services)

    const request = (className: string | number | symbol, methodName: string | number | symbol, args: any[]) => {
        return new Promise(async (resolve, reject) => {
            let localId = ++id
            messages[localId] = { resolve, reject }
            if (!_ready) {
                await ready
            }
            let request: ServiceResponse = {
                id,
                data: {
                    className,
                    methodName,
                    args
                }
            }
            client.send(JSON.stringify(request))
        })
    }


    return new Proxy({}, {
        get(classTarget, className, classReceiver) {
            return new Proxy({}, {
                get(target, methodName, receiver) {
                    return function () {
                        return request(className, methodName, Array.prototype.map.call(arguments, e => e))
                    }
                }
            })
        }
    })


}


export function Service<T extends { new(...args: any[]): {} }>(
    constructor: T
) {
    let inst: any = null
    Object.defineProperty(services, constructor.name, {
        get() {
            if (inst == null) {
                inst = new constructor(services)
            }
            return inst
        },
        set(v: T) {
            inst = v
        },
        enumerable: true
    })
}

export function Connect() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const { constructor: { name } } = target
        if (!(name in methods)) {
            methods[name] = {}
        }
        methods[name][propertyKey] = true
    };
}