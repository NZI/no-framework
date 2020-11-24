import {Client} from '../my-framework/index'
import '../service-loader'
import {MessageService} from '../services/MessageService'

const host = 'localhost'
const port = 8081

async function main () {

    const client = Client("ws://localhost:8082")
    const MessageService: MessageService = client['MessageService']
    const workDone = await MessageService.doWork(123, 123)


}

main()