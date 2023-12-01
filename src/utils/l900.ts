import L530 from "./l530";

export default class L900 extends L530 {
  constructor(
    public readonly ipAddress: string,
    public readonly email: string,
    public readonly password: string,
    public readonly timeout: number,
    public readonly interfaceIp: string,
  ) {
    super(ipAddress, email, password, timeout, interfaceIp);
  }
}