package com.banfico.banking.service;

import com.banfico.banking.dto.TransferCreateRequest;
import com.banfico.banking.dto.TransferResponse;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.BankTransaction;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.entity.Transfer;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import com.banfico.banking.repository.TransferRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {
    @Mock private TransferRepository transferRepository;
    @Mock private BankAccountRepository accountRepository;
    @Mock private BankTransactionRepository transactionRepository;
    @Mock private CustomerIdentityService identityService;
    @Mock private NotificationService notificationService;
    @Mock private Authentication authentication;

    @InjectMocks private TransferService transferService;

    @Test
    void successfulTransferDebitsAndCreditsWithSharedReference() {
        BankAccount source = account(1L, "AC000001", 10_000D);
        BankAccount destination = account(2L, "AC000002", 5_000D);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(source));
        when(accountRepository.findByAccountNumber("AC000002")).thenReturn(Optional.of(destination));
        when(identityService.hasRole(authentication, "CUSTOMER")).thenReturn(true);
        when(identityService.currentCustomer(authentication)).thenReturn(source.getCustomer());
        when(transferRepository.save(any(Transfer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountRepository.findLockedById(1L)).thenReturn(Optional.of(source));
        when(accountRepository.findLockedById(2L)).thenReturn(Optional.of(destination));
        when(transactionRepository.save(any(BankTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransferCreateRequest request = request(1L, "AC000002", 3_000D);
        TransferResponse response = transferService.create(request, authentication);

        assertEquals("COMPLETED", response.getStatus());
        assertEquals(7_000D, source.getBalance());
        assertEquals(8_000D, destination.getBalance());
        ArgumentCaptor<BankTransaction> transactions = ArgumentCaptor.forClass(BankTransaction.class);
        verify(transactionRepository, org.mockito.Mockito.times(2)).save(transactions.capture());
        List<BankTransaction> saved = transactions.getAllValues();
        assertEquals("DEBIT", saved.get(0).getType());
        assertEquals("CREDIT", saved.get(1).getType());
        assertEquals(response.getReferenceNumber(), saved.get(0).getReferenceId());
        assertEquals(response.getReferenceNumber(), saved.get(1).getReferenceId());
    }

    @Test
    void insufficientBalanceDoesNotChangeBalancesOrCreateLedgerRows() {
        BankAccount source = account(1L, "AC000001", 2_000D);
        BankAccount destination = account(2L, "AC000002", 5_000D);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(source));
        when(accountRepository.findByAccountNumber("AC000002")).thenReturn(Optional.of(destination));
        when(identityService.hasRole(authentication, "CUSTOMER")).thenReturn(true);
        when(identityService.currentCustomer(authentication)).thenReturn(source.getCustomer());
        when(transferRepository.save(any(Transfer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountRepository.findLockedById(1L)).thenReturn(Optional.of(source));
        when(accountRepository.findLockedById(2L)).thenReturn(Optional.of(destination));

        TransferResponse response = transferService.create(request(1L, "AC000002", 5_000D), authentication);

        assertEquals("FAILED", response.getStatus());
        assertNotNull(response.getRejectionReason());
        assertEquals(2_000D, source.getBalance());
        assertEquals(5_000D, destination.getBalance());
        verify(accountRepository, never()).save(any(BankAccount.class));
        verify(transactionRepository, never()).save(any(BankTransaction.class));
    }

    private static BankAccount account(Long id, String number, Double balance) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setName("Customer " + id);
        customer.setEmail("customer" + id + "@example.com");
        BankAccount account = new BankAccount();
        account.setId(id);
        account.setAccountNumber(number);
        account.setAccountType("SAVINGS");
        account.setBalance(balance);
        account.setStatus("ACTIVE");
        account.setCustomer(customer);
        return account;
    }

    private static TransferCreateRequest request(Long sourceId, String destinationNumber, Double amount) {
        TransferCreateRequest request = new TransferCreateRequest();
        request.setSourceAccountId(sourceId);
        request.setDestinationAccountNumber(destinationNumber);
        request.setAmount(amount);
        request.setDescription("Test transfer");
        return request;
    }
}
