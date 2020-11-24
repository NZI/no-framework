import {Service, Connect} from '../my-framework'

@Service
export class MessageService {

    constructor(services: any) {

    }

    @Connect() async doWork(left: number, right: number) {
        return left + right
    }
}