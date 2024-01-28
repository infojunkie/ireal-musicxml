import pkg from '../package.json';

export class Version {
  static name = pkg.name;
  static version = pkg.version;
  static author = pkg.author;
  static description = pkg.description;
}