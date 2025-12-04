import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useUpdateKeyResult } from '../hooks'
import type { KeyResult } from '../types'

interface UpdateProgressModalProps {
  keyResult: KeyResult
  isOpen: boolean
  onClose: () => void
}

export function UpdateProgressModal({
  keyResult,
  isOpen,
  onClose,
}: UpdateProgressModalProps) {
  const [currentValue, setCurrentValue] = useState(
    keyResult.currentValue.toString()
  )
  const toast = useToast()
  const updateKeyResult = useUpdateKeyResult()

  const handleSubmit = async () => {
    const value = parseFloat(currentValue)
    if (isNaN(value) || value < 0) {
      toast({
        title: 'Current value must be 0 or greater',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      await updateKeyResult.mutateAsync({
        id: keyResult.id,
        payload: { currentValue: value },
      })
      toast({
        title: 'Progress updated',
        status: 'success',
        duration: 3000,
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Failed to update progress',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Progress</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4} fontWeight="medium">
            {keyResult.title}
          </Text>
          <Text mb={4} fontSize="sm" color="gray.600">
            Target: {keyResult.targetValue} {keyResult.unit}
          </Text>
          <FormControl isRequired>
            <FormLabel>Current Value</FormLabel>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="Enter current value"
              min="0"
              step="0.01"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={updateKeyResult.isPending}
          >
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
