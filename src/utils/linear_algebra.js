/**
 * @file src/utils/linear_algebra.js
 * @description Librería ultra-ligera de vectores 3D para el kernel.
 */
export class Vector3 {
    constructor(x=0, y=0, z=0) { this.x = x; this.y = y; this.z = z; }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    subtract(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    magnitude() { return Math.sqrt(this.x**2 + this.y**2 + this.z**2); }
    normalize() { const mag = this.magnitude(); if(mag > 0) { this.multiplyScalar(1/mag); } return this; }
    clone() { return new Vector3(this.x, this.y, this.z); }
    toArray() { return [this.x, this.y, this.z]; }
    static random() { return new Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize(); }
}