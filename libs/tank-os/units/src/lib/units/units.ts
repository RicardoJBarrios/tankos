import { Component } from '@angular/core';

@Component({
  selector: 'tankos-units',
  imports: [],
  templateUrl: './units.html',
  styleUrl: './units.css',
})
/**
 * Entry component for the units library.
 *
 * @remarks The component is intentionally limited to presentation ownership;
 * unit contracts and conversion rules belong in separate files as the library
 * grows.
 */
export class Units {}
