import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ModalType = 'NovaTarefa' | 'Visual' | 'Config' | 'Conexoes' | 'Conta' | 'EditTarefa' | 'TarefaDetalhe' | null;

interface ModalState {
  activeModal: ModalType;
  showBlockingOverlay: boolean;
  modalData?: any; // Optional data to pass to modals
}

@Injectable({
  providedIn: 'root'
})
export class ModalStateService {
  private modalStateSubject = new BehaviorSubject<ModalState>({
    activeModal: null,
    showBlockingOverlay: false,
    modalData: null
  });

  public modalState$: Observable<ModalState> = this.modalStateSubject.asObservable();

  // Convenience observables for individual properties
  public activeModal$: Observable<ModalType> = new BehaviorSubject<ModalType>(null);
  public showBlockingOverlay$: Observable<boolean> = new BehaviorSubject<boolean>(false);
  public modalData$: Observable<any> = new BehaviorSubject<any>(null);

  constructor() {
    // Subscribe to modal state changes and update individual observables
    this.modalState$.subscribe(state => {
      (this.activeModal$ as BehaviorSubject<ModalType>).next(state.activeModal);
      (this.showBlockingOverlay$ as BehaviorSubject<boolean>).next(state.showBlockingOverlay);
      (this.modalData$ as BehaviorSubject<any>).next(state.modalData);
    });
  }

  /**
   * Open a modal
   * @param modalName Name of the modal to open
   * @param data Optional data to pass to the modal
   */
  openModal(modalName: ModalType, data?: any): void {
    if (modalName === null) {
      this.closeAllModals();
      return;
    }

    const currentState = this.modalStateSubject.value;

    // If same modal is clicked again, close it
    if (currentState.activeModal === modalName) {
      this.closeAllModals();
      return;
    }

    // Close all and open the selected one
    this.modalStateSubject.next({
      activeModal: modalName,
      showBlockingOverlay: true,
      modalData: data || null
    });
  }

  /**
   * Close all modals and hide overlay
   */
  closeAllModals(): void {
    this.modalStateSubject.next({
      activeModal: null,
      showBlockingOverlay: false,
      modalData: null
    });
  }

  /**
   * Get current modal state
   */
  getCurrentState(): ModalState {
    return this.modalStateSubject.value;
  }

  /**
   * Get current active modal name
   */
  getActiveModal(): ModalType {
    return this.modalStateSubject.value.activeModal;
  }

  /**
   * Get current modal data
   */
  getModalData(): any {
    return this.modalStateSubject.value.modalData;
  }

  /**
   * Check if blocking overlay is visible
   */
  isBlocking(): boolean {
    return this.modalStateSubject.value.showBlockingOverlay;
  }
}

