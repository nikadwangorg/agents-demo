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
  Select,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useCreateKeyResult } from '../hooks'

interface CreateKeyResultModalProps {
  objectiveId: string
  isOpen: boolean
  onClose: () => void
}

export function CreateKeyResultModal({
  objectiveId,
  isOpen,
  onClose,
}: CreateKeyResultModalProps) {
  const [title, setTitle] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('percent')
  const toast = useToast()
  const createKeyResult = useCreateKeyResult()

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title is required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    const target = parseFloat(targetValue)
    if (isNaN(target) || target <= 0) {
      toast({
        title: 'Target value must be greater than 0',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      await createKeyResult.mutateAsync({
        objectiveId,
        payload: {
          title: title.trim(),
          targetValue: target,
          unit,
        },
      })
      toast({
        title: 'Key Result created',
        status: 'success',
        duration: 3000,
      })
      setTitle('')
      setTargetValue('')
      setUnit('percent')
      onClose()
    } catch (error) {
      toast({
        title: 'Failed to create key result',
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
        <ModalHeader>Add Key Result</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter key result title"
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Target Value</FormLabel>
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Enter target value"
              min="0.01"
              step="0.01"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Unit</FormLabel>
            <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="percent">Percent (%)</option>
              <option value="count">Count</option>
              <option value="currency">Currency ($)</option>
              <option value="users">Users</option>
              <option value="hours">Hours</option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={createKeyResult.isPending}
          >
            Add
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
