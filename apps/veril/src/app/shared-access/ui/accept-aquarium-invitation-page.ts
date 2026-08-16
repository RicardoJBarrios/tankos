import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseClient } from '../../shared/infrastructure/firebase-client';

@Component({
  selector: 'veril-accept-aquarium-invitation-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './accept-aquarium-invitation-page.html',
  styleUrl: './accept-aquarium-invitation-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptAquariumInvitationPage {
  readonly code = signal('');
  readonly message = signal('');
  readonly state = signal<'ready' | 'saving' | 'success' | 'failure'>('ready');

  async accept(): Promise<void> {
    this.state.set('saving');
    try {
      const invitationCode = this.code().trim();
      const { auth, firestore } = getFirebaseClient();
      const user = auth.currentUser;
      if (!user || user.isAnonymous || !invitationCode) throw new Error();
      const invitation = await getDoc(
        doc(firestore, 'aquariumAccessInvitations', invitationCode),
      );
      if (!invitation.exists() || invitation.data()['status'] !== 'active')
        throw new Error();
      const data = invitation.data();
      await setDoc(
        doc(
          firestore,
          'aquariumAccessGrants',
          `${data['aquariumId']}_${user.uid}`,
        ),
        {
          aquariumId: data['aquariumId'],
          ownerId: data['ownerId'],
          granteeUserId: user.uid,
          invitationCode,
          permissions: data['permissions'],
          status: 'active',
          createdAt: Timestamp.now(),
        },
      );
      this.state.set('success');
      this.message.set('Invitación aceptada.');
    } catch {
      this.state.set('failure');
      this.message.set('No se puede aceptar esta invitación.');
    }
  }
}
